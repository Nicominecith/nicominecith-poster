use poster_canvas::Area;
use poster_model::Scene;

use crate::metrics::Metrics;

/// The poster's boxes: the framed paper inside the outer padding, and the
/// content column inside the frame.
#[derive(Debug, Clone, Copy)]
pub(crate) struct Frame {
    pub(crate) paper: Area,
    pub(crate) content_x: f32,
    pub(crate) content_top: f32,
    pub(crate) content_bottom: f32,
    pub(crate) content_width: f32,
}

impl Frame {
    pub(crate) fn of(scene: &Scene, metrics: &Metrics) -> Self {
        let outer = metrics.outer_pad;
        let paper = Area::new(
            outer,
            outer,
            scene.width as f32 - 2.0 * outer,
            scene.height as f32 - 2.0 * outer,
        );
        Self {
            paper,
            content_x: paper.x + metrics.frame_border + metrics.inner_pad,
            content_top: paper.y + metrics.frame_border + metrics.inner_pad,
            content_bottom: outer + paper.height - metrics.frame_border - metrics.inner_pad,
            content_width: metrics.content_width,
        }
    }

    /// The cover's box, centred in the content column.
    pub(crate) fn cover(&self, metrics: &Metrics) -> Area {
        Area::new(
            self.content_x + (self.content_width - metrics.cover_width) / 2.0,
            self.content_top,
            metrics.cover_width,
            metrics.cover_height,
        )
    }

    /// The side column's left edge, flush with the content's right edge.
    pub(crate) fn side_x(&self, metrics: &Metrics) -> f32 {
        self.content_x + self.content_width - metrics.side_width
    }
}
