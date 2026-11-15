use tiny_skia::Pixmap;

/// Three box passes approximate a Gaussian.
const PASSES: usize = 3;
const CHANNELS: usize = 4;

/// Blurs in place. Each pass keeps a running sum per row, so the cost per
/// pixel does not grow with the radius.
pub fn box_blur(pixmap: &mut Pixmap, radius: u32) {
    if radius == 0 || pixmap.width() == 0 || pixmap.height() == 0 {
        return;
    }
    let width = pixmap.width() as usize;
    let height = pixmap.height() as usize;
    let radius = radius as usize;
    let mut data = pixmap.data().to_vec();
    let mut scratch = vec![0; data.len()];
    for _ in 0..PASSES {
        blur_rows(&data, &mut scratch, width, height, radius);
        transpose(&scratch, &mut data, width, height);
        blur_rows(&data, &mut scratch, height, width, radius);
        transpose(&scratch, &mut data, height, width);
    }
    pixmap.data_mut().copy_from_slice(&data);
}

/// Divides a window sum by the window size with a multiply and a shift: a
/// rounded-up 32.32 reciprocal gives the same floor as integer division for
/// every sum 8-bit samples can reach.
struct WindowMean {
    reciprocal: u64,
}

impl WindowMean {
    const SHIFT: u32 = 32;

    fn new(window: usize) -> Self {
        let window = window as u64;
        Self { reciprocal: (1u64 << Self::SHIFT).div_ceil(window) }
    }

    fn of(&self, sum: u32) -> u8 {
        ((u64::from(sum) * self.reciprocal) >> Self::SHIFT) as u8
    }
}

/// One horizontal pass over every row, clamping at the edges.
fn blur_rows(src: &[u8], dst: &mut [u8], width: usize, height: usize, radius: usize) {
    let mean = WindowMean::new(radius * 2 + 1);
    let last = width - 1;
    for row in
        src.chunks_exact(width * CHANNELS).zip(dst.chunks_exact_mut(width * CHANNELS)).take(height)
    {
        let (src, dst) = row;
        let sample = |x: usize, channel: usize| u32::from(src[x * CHANNELS + channel]);
        let mut sums = [0u32; CHANNELS];
        for (channel, sum) in sums.iter_mut().enumerate() {
            // The window centred on x = 0, its left half clamped to the edge.
            *sum = sample(0, channel) * (radius as u32 + 1);
            *sum += (1..=radius.min(last)).map(|x| sample(x, channel)).sum::<u32>();
            if radius >= width {
                *sum += sample(last, channel) * (radius - width + 1) as u32;
            }
        }
        for x in 0..width {
            let leaving = x.saturating_sub(radius);
            let entering = (x + radius + 1).min(last);
            for (channel, sum) in sums.iter_mut().enumerate() {
                dst[x * CHANNELS + channel] = mean.of(*sum);
                *sum += sample(entering, channel);
                *sum -= sample(leaving, channel);
            }
        }
    }
}

/// Swaps rows and columns, so the row pass also blurs the other axis.
fn transpose(src: &[u8], dst: &mut [u8], width: usize, height: usize) {
    for y in 0..height {
        for x in 0..width {
            let from = (y * width + x) * CHANNELS;
            let to = (x * height + y) * CHANNELS;
            dst[to..to + CHANNELS].copy_from_slice(&src[from..from + CHANNELS]);
        }
    }
}
