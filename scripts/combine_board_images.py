"""Blend two photographic captures of the Scotland Yard board into a single sharpened reference.

Usage:
    /Users/griffinb/LiveScotlandYard/.venv/bin/python scripts/combine_board_images.py \
        --primary "Scotland Yard game board.jpg" \
        --secondary "Scotland Yard game board2.jpg" \
        --output assets/board/scotland_yard_board.png

The script performs the following steps:
1. Loads both source images.
2. Aligns the secondary image to the primary via ORB feature matching + homography.
3. Computes a per-pixel sharpness weight using a Laplacian-of-Gaussian map.
4. Blends pixels based on sharpness so the sharper region from either source wins.
5. Applies a light unsharp mask to counteract blur.
6. Saves the fused result and an aligned-secondary debug overlay next to it.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for the board image fusion script.

    Returns:
        argparse.Namespace: Parsed command-line arguments containing paths for input images,
            output destination, and debug directory.
    """
    parser = argparse.ArgumentParser(description="Fuse multiple board photos into a single cleaned map")
    parser.add_argument("--primary", type=Path, required=True, help="Path to the base image (reference perspective)")
    parser.add_argument("--secondary", type=Path, required=True, help="Path to the secondary image to align")
    parser.add_argument("--output", type=Path, required=True, help="Destination PNG for the blended map")
    parser.add_argument("--debug-dir", type=Path, default=Path("assets/board"), help="Directory for debug outputs")
    return parser.parse_args()


def load_image(path: Path) -> np.ndarray:
    """Load an image from disk in BGR color format.

    Args:
        path: Path to the image file to load.

    Returns:
        np.ndarray: The loaded image as a NumPy array in BGR color format.

    Raises:
        FileNotFoundError: If the image cannot be loaded from the specified path.
    """
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise FileNotFoundError(f"Unable to load image: {path}")
    return image


def align_secondary(primary: np.ndarray, secondary: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Align secondary image onto the primary using ORB + homography.

    Uses ORB (Oriented FAST and Rotated BRIEF) feature detection to find matching
    keypoints between the primary and secondary images, then computes a homography
    transformation to warp the secondary image to match the primary's perspective.

    Args:
        primary: The reference image in BGR format.
        secondary: The image to align to the primary's perspective.

    Returns:
        tuple[np.ndarray, np.ndarray]: A tuple containing:
            - The warped secondary image aligned to the primary's perspective
            - The homography matrix used for the transformation

    Raises:
        RuntimeError: If ORB descriptor computation fails or insufficient feature
            matches are found (< 12 matches required).
    """
    orb = cv2.ORB_create(nfeatures=5000)
    primary_gray = cv2.cvtColor(primary, cv2.COLOR_BGR2GRAY)
    secondary_gray = cv2.cvtColor(secondary, cv2.COLOR_BGR2GRAY)

    kp1, des1 = orb.detectAndCompute(primary_gray, None)
    kp2, des2 = orb.detectAndCompute(secondary_gray, None)
    if des1 is None or des2 is None:
        raise RuntimeError("Failed to compute ORB descriptors for alignment")

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = matcher.match(des1, des2)
    if len(matches) < 12:
        raise RuntimeError("Not enough feature matches to compute homography")

    matches = sorted(matches, key=lambda m: m.distance)[:300]
    src_pts = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)

    H, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)
    if H is None:
        raise RuntimeError("Could not compute homography")

    warped_secondary = cv2.warpPerspective(secondary, H, (primary.shape[1], primary.shape[0]))
    return warped_secondary, H


def laplacian_sharpness(image: np.ndarray, sigma: float = 1.5) -> np.ndarray:
    """Compute a per-pixel sharpness map using Laplacian-of-Gaussian.

    Measures local sharpness by computing the Laplacian (second derivative) of the
    image, squaring it, and smoothing with a Gaussian blur. Higher values indicate
    sharper regions.

    Args:
        image: Input image in BGR color format.
        sigma: Standard deviation for Gaussian blur applied to the Laplacian squared map.

    Returns:
        np.ndarray: Normalized sharpness map with values in [0, 1], with a small epsilon
            added to avoid division by zero in subsequent operations.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = gray.astype(np.float32) / 255.0
    lap = cv2.Laplacian(gray, cv2.CV_32F)
    sharpness = cv2.GaussianBlur(lap ** 2, (0, 0), sigma)
    sharpness = cv2.normalize(sharpness, None, 0.0, 1.0, cv2.NORM_MINMAX)
    return sharpness + 1e-6  # avoid divide-by-zero


def blend_images(primary: np.ndarray, secondary: np.ndarray) -> np.ndarray:
    """Blend two images based on per-pixel sharpness weights.

    Computes sharpness maps for both images and blends them such that sharper
    regions from either image are preferentially selected. This creates a composite
    image that uses the best-focused parts from both sources.

    Args:
        primary: The primary/base image in BGR format.
        secondary: The secondary image to blend in BGR format (should be aligned to primary).

    Returns:
        np.ndarray: The blended image in BGR format as uint8.
    """
    sharp_primary = laplacian_sharpness(primary)
    sharp_secondary = laplacian_sharpness(secondary)

    weight_primary = sharp_primary / (sharp_primary + sharp_secondary)
    weight_secondary = 1.0 - weight_primary

    primary_f = primary.astype(np.float32)
    secondary_f = secondary.astype(np.float32)
    blended = primary_f * weight_primary[..., None] + secondary_f * weight_secondary[..., None]
    return blended.astype(np.uint8)


def unsharp_mask(image: np.ndarray, radius: int = 3, amount: float = 1.2) -> np.ndarray:
    """Apply an unsharp mask to enhance image sharpness.

    Sharpens the image by subtracting a blurred version from the original, effectively
    enhancing edges and fine details.

    Args:
        image: Input image in BGR format.
        radius: Standard deviation for the Gaussian blur kernel.
        amount: Strength of the sharpening effect (higher values = more sharpening).

    Returns:
        np.ndarray: Sharpened image in BGR format as uint8, with values clipped to [0, 255].
    """
    blurred = cv2.GaussianBlur(image, (0, 0), radius)
    sharpened = cv2.addWeighted(image, 1 + amount, blurred, -amount, 0)
    return np.clip(sharpened, 0, 255).astype(np.uint8)


def main() -> None:
    """Main entry point for the board image fusion pipeline.

    Orchestrates the complete workflow: loads two board images, aligns the secondary
    to the primary using feature matching, blends them based on sharpness, applies
    sharpening, and saves the result along with debug outputs.
    """
    args = parse_args()
    primary = load_image(args.primary)
    secondary = load_image(args.secondary)

    warped_secondary, H = align_secondary(primary, secondary)
    blended = blend_images(primary, warped_secondary)
    sharpened = unsharp_mask(blended)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(args.output), sharpened)

    # Save debug overlays for manual QA.
    debug_dir = args.debug_dir
    debug_dir.mkdir(parents=True, exist_ok=True)
    overlay = cv2.addWeighted(primary, 0.5, warped_secondary, 0.5, 0)
    cv2.imwrite(str(debug_dir / "board_overlay.png"), overlay)
    np.save(debug_dir / "homography.npy", H)

    print(f"Blended board saved to {args.output}")
    print(f"Debug overlay saved to {debug_dir / 'board_overlay.png'}")


if __name__ == "__main__":
    main()
