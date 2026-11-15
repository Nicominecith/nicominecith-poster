use std::mem;

use crate::{
    chain::FontChain,
    layout::{width, Setting},
    script::clusters,
};

/// Builds lines word by word, never wider than `max_width` unless a single
/// cluster is.
struct Lines<'c, 'a> {
    chain: &'c FontChain<'a>,
    setting: Setting,
    max_width: f32,
    done: Vec<String>,
    current: String,
    current_width: f32,
}

impl Lines<'_, '_> {
    fn measure(&self, text: &str) -> f32 {
        width(self.chain, text, self.setting)
    }

    fn break_line(&mut self) {
        self.done.push(mem::take(&mut self.current));
        self.current_width = 0.0;
    }

    fn would_overflow(&self, width: f32) -> bool {
        !self.current.is_empty() && width > self.max_width
    }

    fn push_word(&mut self, word: &str, word_width: f32, space_width: f32) {
        if self.would_overflow(self.current_width + space_width + word_width) {
            self.break_line();
        }
        if word_width > self.max_width {
            self.push_split(word);
        } else if self.current.is_empty() {
            word.clone_into(&mut self.current);
            self.current_width = word_width;
        } else {
            self.current.push(' ');
            self.current.push_str(word);
            self.current_width += space_width + word_width;
        }
    }

    /// A word no line can hold, broken between grapheme clusters.
    fn push_split(&mut self, word: &str) {
        if !self.current.is_empty() {
            self.break_line();
        }
        for (_, cluster) in clusters(word) {
            let cluster_width = self.measure(cluster);
            if self.would_overflow(self.current_width + cluster_width) {
                self.break_line();
            }
            self.current.push_str(cluster);
            self.current_width += cluster_width;
        }
    }

    fn finish(mut self) -> Vec<String> {
        if !self.current.is_empty() || self.done.is_empty() {
            self.done.push(self.current);
        }
        self.done
    }
}

/// Breaks on spaces, and inside a word only when the word alone overflows —
/// which is also how text written without spaces finds its breaks.
pub(crate) fn wrap(chain: &FontChain, text: &str, setting: Setting, max_width: f32) -> Vec<String> {
    let mut lines = Lines {
        chain,
        setting,
        max_width,
        done: Vec::new(),
        current: String::new(),
        current_width: 0.0,
    };
    let space_width = lines.measure(" ");
    for word in text.split_whitespace() {
        let word_width = lines.measure(word);
        lines.push_word(word, word_width, space_width);
    }
    lines.finish()
}
