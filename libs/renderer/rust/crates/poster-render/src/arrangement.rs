use poster_model::Scene;
use poster_text::{FontLibrary, Paragraph, Typesetter};

use crate::{frame::Frame, metrics::Metrics, paragraph::stacked, side::SideColumn, BODY_LEADING};

/// The poster's text, wrapped, and the flexible gap left under the cover:
/// everything below the cover is measured first so it can sit at the bottom.
#[derive(Debug, Clone)]
pub(crate) struct Arrangement {
    pub(crate) title: Paragraph,
    pub(crate) subtitle: Paragraph,
    pub(crate) palette_index_height: f32,
    pub(crate) columns: Vec<Vec<Paragraph>>,
    pub(crate) column_width: f32,
    pub(crate) free_gap: f32,
}

impl Arrangement {
    pub(crate) fn measure(scene: &Scene, fonts: &FontLibrary) -> Self {
        let metrics = Metrics::of(scene);
        let frame = Frame::of(scene, &metrics);
        let width = frame.content_width;

        let title = Typesetter::new(fonts, &scene.title_font).wrap(
            &scene.title,
            width,
            scene.theme.title_leading,
        );
        let subtitle =
            Typesetter::new(fonts, &scene.subtitle_font).wrap(&scene.subtitle, width, BODY_LEADING);
        let palette_index_height = scene
            .palette_index_font
            .as_ref()
            .map_or(0.0, |font| metrics.palette_index_gap + font.size * BODY_LEADING);
        let column_width = column_width(scene, &metrics);
        let columns = wrap_columns(scene, fonts, &metrics, column_width);

        let palette_height = if scene.has_palette() {
            metrics.palette_top + metrics.palette_height + palette_index_height
        } else {
            0.0
        };
        // An empty subtitle takes neither its line nor the gap above it.
        let subtitle_height =
            if subtitle.is_blank() { 0.0 } else { metrics.title_gap + subtitle.height() };
        let header_height = metrics.cover_gap + title.height() + subtitle_height + palette_height;

        let rows_height = columns
            .iter()
            .map(|rows| {
                let heights: Vec<f32> = rows.iter().map(Paragraph::height).collect();
                stacked(&heights, metrics.row_gap)
            })
            .fold(0.0, f32::max);
        let side_height = SideColumn::new(scene, fonts, &metrics, None).height();
        let stack_height = header_height + metrics.content_gap + rows_height.max(side_height);
        let available = frame.content_bottom - (frame.content_top + metrics.cover_height);

        Self {
            title,
            subtitle,
            palette_index_height,
            columns,
            column_width,
            free_gap: (available - stack_height).max(0.0),
        }
    }
}

/// Each column's share of the content width left of the side column.
fn column_width(scene: &Scene, metrics: &Metrics) -> f32 {
    if scene.columns.is_empty() {
        return 0.0;
    }
    let count = scene.columns.len() as f32;
    (metrics.content_width
        - metrics.side_width
        - metrics.content_gap
        - metrics.column_gap * (count - 1.0))
        / count
}

/// Every row's label, wrapped beside the room its detail takes.
fn wrap_columns(
    scene: &Scene,
    fonts: &FontLibrary,
    metrics: &Metrics,
    column_width: f32,
) -> Vec<Vec<Paragraph>> {
    let font = Typesetter::new(fonts, &scene.row_font).tabular();
    scene
        .columns
        .iter()
        .map(|column| {
            column
                .iter()
                .map(|row| {
                    let detail_width = if row.detail.is_empty() {
                        0.0
                    } else {
                        metrics.detail_gap + font.digits_width(row.detail.chars().count())
                    };
                    font.wrap(&row.label, (column_width - detail_width).max(1.0), BODY_LEADING)
                })
                .collect()
        })
        .collect()
}
