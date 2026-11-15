use poster_model::Scene;

/// The gap between a numbered swatch and its index, in poster units.
const PALETTE_INDEX_GAP: f32 = 4.0;

/// Every layout measure the painter uses, in output pixels.
#[derive(Debug, Clone, Copy)]
pub(crate) struct Metrics {
    pub(crate) outer_pad: f32,
    pub(crate) inner_pad: f32,
    pub(crate) frame_border: f32,
    pub(crate) content_width: f32,
    pub(crate) cover_width: f32,
    pub(crate) cover_height: f32,
    pub(crate) cover_gap: f32,
    pub(crate) title_gap: f32,
    pub(crate) side_width: f32,
    pub(crate) qr_size: f32,
    pub(crate) side_gap: f32,
    pub(crate) row_gap: f32,
    pub(crate) column_gap: f32,
    pub(crate) content_gap: f32,
    pub(crate) detail_gap: f32,
    pub(crate) palette_top: f32,
    pub(crate) palette_width: f32,
    pub(crate) palette_height: f32,
    pub(crate) palette_gap: f32,
    pub(crate) palette_index_gap: f32,
}

impl Metrics {
    pub(crate) fn of(scene: &Scene) -> Self {
        let px = |units: f32| units * scene.scale;
        let layout = &scene.layout;
        let theme = &scene.theme;
        Self {
            outer_pad: px(layout.outer_pad),
            inner_pad: px(layout.inner_pad),
            frame_border: px(theme.frame_border),
            content_width: px(layout.content_width),
            cover_width: px(layout.cover_width),
            cover_height: px(layout.cover_height()),
            cover_gap: px(layout.cover_gap),
            title_gap: px(layout.title_gap),
            side_width: px(layout.side_width),
            qr_size: px(layout.qr_size),
            side_gap: px(layout.side_gap),
            row_gap: px(layout.row_gap),
            column_gap: px(layout.column_gap),
            content_gap: px(layout.content_gap),
            detail_gap: px(layout.detail_gap),
            palette_top: px(theme.palette_top),
            palette_width: px(theme.palette_width),
            palette_height: px(theme.palette_height),
            palette_gap: px(theme.palette_gap),
            palette_index_gap: px(PALETTE_INDEX_GAP),
        }
    }
}
