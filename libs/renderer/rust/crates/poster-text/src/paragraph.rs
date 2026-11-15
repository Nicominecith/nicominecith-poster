/// Wrapped lines and the height each takes.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Paragraph {
    pub lines: Vec<String>,
    pub line_height: f32,
}

impl Paragraph {
    /// At least one line high, even when empty, as a CSS line box is.
    #[must_use]
    pub fn height(&self) -> f32 {
        self.line_height * self.lines.len().max(1) as f32
    }

    /// Whether it prints nothing, like a subtitle left empty.
    #[must_use]
    pub fn is_blank(&self) -> bool {
        self.lines.iter().all(|line| line.trim().is_empty())
    }
}
