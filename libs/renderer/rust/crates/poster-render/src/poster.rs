use poster_canvas::{Canvas, Pixmap};
use poster_model::Scene;
use poster_text::FontLibrary;

use crate::{
    arrangement::Arrangement, assets::Assets, context::Context, cover, frame::Frame, heading,
    metrics::Metrics, palette, rows, side::SideColumn,
};

/// A run of whole rows of the poster.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Band {
    pub top: u32,
    pub rows: u32,
}

/// What a poster needs before any band is painted: its images converted and
/// its text measured. Keep it to paint further bands without repeating that.
#[derive(Debug)]
pub struct Prepared {
    assets: Assets,
    arrangement: Arrangement,
}

/// A scene with the fonts it is set in.
#[derive(Debug, Clone, Copy)]
pub struct Poster<'a> {
    scene: &'a Scene,
    fonts: &'a FontLibrary,
}

impl<'a> Poster<'a> {
    #[must_use]
    pub fn new(scene: &'a Scene, fonts: &'a FontLibrary) -> Self {
        Self { scene, fonts }
    }

    /// Converts the images in `pixels` and measures the text.
    #[must_use]
    pub fn prepare(&self, pixels: &[u8]) -> Prepared {
        Prepared {
            assets: Assets::prepare(self.scene, pixels),
            arrangement: Arrangement::measure(self.scene, self.fonts),
        }
    }

    /// The whole poster. `None` for a scene with no pixels.
    #[must_use]
    pub fn render(&self, pixels: &[u8]) -> Option<Pixmap> {
        self.paint(&self.prepare(pixels), Band { top: 0, rows: self.scene.height })
    }

    /// One band, clipped to the poster. `None` when the band holds no rows.
    #[must_use]
    pub fn paint(&self, prepared: &Prepared, band: Band) -> Option<Pixmap> {
        let scene = self.scene;
        let rows = band.rows.min(scene.height.saturating_sub(band.top));
        let mut canvas = Canvas::band(scene.width, scene.height, band.top, rows)?;
        let Prepared { assets, arrangement } = prepared;
        let metrics = Metrics::of(scene);
        let frame = Frame::of(scene, &metrics);
        let context = Context { scene, fonts: self.fonts, metrics, arrangement };

        self.paint_ground(&mut canvas, assets, &frame);
        cover::paint(&mut canvas, &context, frame.cover(&metrics), assets.cover.as_ref());

        let x = frame.content_x;
        let width = frame.content_width;
        let mut y = frame.content_top + metrics.cover_height + arrangement.free_gap;
        y += metrics.cover_gap;
        y = heading::paint(&mut canvas, &context, (x, y, width));
        if scene.has_palette() {
            y += metrics.palette_top;
            palette::paint(&mut canvas, &context, (x, y, width));
            y += metrics.palette_height + arrangement.palette_index_height;
        }
        y += metrics.content_gap;
        rows::paint(&mut canvas, &context, (x, y));
        let side = SideColumn::new(scene, self.fonts, &metrics, assets.code.as_ref());
        side.paint(&mut canvas, frame.side_x(&metrics), y, metrics.side_width);
        Some(canvas.into_pixmap())
    }

    /// The mat, the full-bleed backdrop, and the framed paper.
    fn paint_ground(&self, canvas: &mut Canvas, assets: &Assets, frame: &Frame) {
        let theme = &self.scene.theme;
        let poster = canvas.poster();
        canvas.fill(poster, theme.mat.to_skia());
        if let Some(backdrop) = &assets.backdrop {
            canvas.draw_scaled(backdrop, poster);
        }
        // A backdrop style keeps the paper transparent over its backdrop.
        if !theme.backdrop {
            canvas.fill(frame.paper, theme.paper.to_skia());
        }
        let border = theme.frame_border * self.scene.scale;
        if border > 0.0 {
            canvas.fill_border(frame.paper, border, theme.ink.to_skia());
        }
    }
}
