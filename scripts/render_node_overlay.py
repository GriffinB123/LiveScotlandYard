"""Project node coordinates onto a board photo and emit an annotated overlay.

Usage example:

	/Users/griffinb/LiveScotlandYard/.venv/bin/python scripts/render_node_overlay.py \
		--board "Scotland Yard game board2.jpg" \
		--nodes-json assets/board/nodes.json \
		--output-image assets/board/board2_nodes_overlay.png \
		--output-json assets/board/nodes_board2.json

The source JSON is expected to follow the format used in
https://github.com/jannikhst/scotland_yard (id, position, edges list). The
script rescales those coordinates to the supplied board photo and draws each
node id for quick verification while also persisting the transformed metadata.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np


@dataclass
class Node:
	node_id: int
	x: float
	y: float
	edges: list[dict]


def parse_args() -> argparse.Namespace:
	"""Parse command-line arguments for the node overlay rendering script.

	Returns:
		argparse.Namespace: Parsed command-line arguments containing paths for board image,
			node data, output files, and rendering parameters.
	"""
	parser = argparse.ArgumentParser(description="Render node overlay onto a board photo")
	parser.add_argument("--board", type=Path, required=True, help="Path to the target board image")
	parser.add_argument("--nodes-json", type=Path, required=True, help="Input JSON containing canonical node data")
	parser.add_argument("--output-image", type=Path, required=True, help="Destination for the overlay PNG")
	parser.add_argument("--output-json", type=Path, required=True, help="Destination JSON for scaled coordinates")
	parser.add_argument(
		"--fit-mode",
		choices=("uniform", "stretch", "raw"),
		default="uniform",
		help="Scaling strategy: uniform preserves aspect ratio, stretch fits each axis independently, raw keeps coordinates untouched",
	)
	parser.add_argument("--margin", type=float, default=12.0, help="Padding (in pixels of target image) to leave around the board when stretching")
	parser.add_argument("--font-scale", type=float, default=0.45, help="OpenCV font scale for node labels")
	parser.add_argument("--circle-radius", type=int, default=8, help="Radius of the node circles in pixels after scaling")
	parser.add_argument("--thickness", type=int, default=2, help="Stroke thickness for circles and text background")
	return parser.parse_args()


def load_nodes(path: Path) -> list[Node]:
	"""Load and parse node data from a JSON file.

	Args:
		path: Path to the JSON file containing node data with id, position, and edges.

	Returns:
		list[Node]: List of Node objects sorted by node_id.
	"""
	data = json.loads(path.read_text())
	nodes = [
		Node(
			node_id=int(entry["id"]),
			x=float(entry["position"]["x"]),
			y=float(entry["position"]["y"]),
			edges=entry["edges"],
		)
		for entry in data
	]
	nodes.sort(key=lambda n: n.node_id)
	return nodes


def compute_transform(nodes: Iterable[Node], width: int, height: int, margin: float, mode: str) -> tuple[float, float, float, float]:
	"""Calculate scaling and offset parameters to map node coordinates to the target image.

	Computes the transformation needed to map canonical node coordinates to the
	target board image dimensions based on the specified fit mode.

	Args:
		nodes: Iterable of Node objects with x, y coordinates.
		width: Target image width in pixels.
		height: Target image height in pixels.
		margin: Padding in pixels to leave around the board.
		mode: Scaling strategy - "uniform" (preserve aspect ratio), "stretch"
			(fit each axis independently), or "raw" (no scaling).

	Returns:
		tuple[float, float, float, float]: A tuple containing (scale_x, scale_y, offset_x, offset_y)
			transformation parameters.

	Raises:
		ValueError: If the margin is too large for the given image dimensions.
	"""
	xs = np.array([n.x for n in nodes], dtype=np.float64)
	ys = np.array([n.y for n in nodes], dtype=np.float64)
	min_x, max_x = float(xs.min()), float(xs.max())
	min_y, max_y = float(ys.min()), float(ys.max())

	src_width = max_x - min_x
	src_height = max_y - min_y
	usable_w = width - 2 * margin
	usable_h = height - 2 * margin
	if usable_w <= 0 or usable_h <= 0:
		raise ValueError("Margin is too large for the given image dimensions")

	if mode == "raw":
		return 1.0, 1.0, 0.0, 0.0
	if mode == "stretch":
		scale_x = float(usable_w / src_width)
		scale_y = float(usable_h / src_height)
		offset_x = float(margin - scale_x * min_x)
		offset_y = float(margin - scale_y * min_y)
	else:
		uniform_scale = float(min(usable_w / src_width, usable_h / src_height))
		offset_x = float((width - uniform_scale * src_width) / 2 - uniform_scale * min_x)
		offset_y = float((height - uniform_scale * src_height) / 2 - uniform_scale * min_y)
		scale_x = scale_y = uniform_scale

	return scale_x, scale_y, offset_x, offset_y


def transform_nodes(nodes: Iterable[Node], scale_x: float, scale_y: float, offset_x: float, offset_y: float) -> list[Node]:
	"""Apply scaling and offset transformation to node coordinates.

	Args:
		nodes: Iterable of Node objects to transform.
		scale_x: Horizontal scaling factor.
		scale_y: Vertical scaling factor.
		offset_x: Horizontal offset in pixels.
		offset_y: Vertical offset in pixels.

	Returns:
		list[Node]: New list of Node objects with transformed coordinates.
	"""
	remapped = []
	for node in nodes:
		remapped.append(
			Node(
				node_id=node.node_id,
				x=float(node.x * scale_x + offset_x),
				y=float(node.y * scale_y + offset_y),
				edges=node.edges,
			)
		)
	return remapped


def draw_overlay(board: np.ndarray, nodes: list[Node], radius: int, thickness: int, font_scale: float) -> np.ndarray:
	"""Render node markers and labels onto the board image.

	Draws amber circles at each node position with the node ID as a centered label.
	Labels have a black outline for better visibility.

	Args:
		board: The board image to draw on (will be copied, not modified in place).
		nodes: List of Node objects with transformed coordinates.
		radius: Circle radius in pixels.
		thickness: Stroke thickness for circles and text.
		font_scale: OpenCV font scale for text labels.

	Returns:
		np.ndarray: New image with node overlay rendered.
	"""
	overlay = board.copy()
	font = cv2.FONT_HERSHEY_SIMPLEX
	for node in nodes:
		center = (int(round(node.x)), int(round(node.y)))
		cv2.circle(overlay, center, radius, (0, 215, 255), thickness)  # amber circles for visibility
		label = str(node.node_id)
		(text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)
		text_org = (center[0] - text_w // 2, center[1] + text_h // 2)
		cv2.putText(overlay, label, text_org, font, font_scale, (0, 0, 0), thickness + 2, cv2.LINE_AA)
		cv2.putText(overlay, label, text_org, font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)
	return overlay


def save_scaled_json(path: Path, nodes: list[Node]) -> None:
	"""Save transformed node coordinates to a JSON file.

	Exports the scaled node data in the same format as the input JSON, with
	coordinates rounded to 2 decimal places.

	Args:
		path: Destination path for the output JSON file.
		nodes: List of Node objects with transformed coordinates to save.
	"""
	serializable = [
		{
			"id": node.node_id,
			"position": {"x": round(node.x, 2), "y": round(node.y, 2)},
			"edges": node.edges,
		}
		for node in nodes
	]
	path.parent.mkdir(parents=True, exist_ok=True)
	path.write_text(json.dumps(serializable, indent=2))


def main() -> None:
	"""Main entry point for the node overlay rendering pipeline.

	Orchestrates the complete workflow: loads the board image and node data,
	computes the coordinate transformation, applies it to the nodes, renders
	the overlay, and saves both the annotated image and transformed coordinates.

	Raises:
		FileNotFoundError: If the board image cannot be loaded.
	"""
	args = parse_args()
	board = cv2.imread(str(args.board), cv2.IMREAD_COLOR)
	if board is None:
		raise FileNotFoundError(f"Unable to load board image: {args.board}")

	nodes = load_nodes(args.nodes_json)
	height, width = board.shape[:2]
	scale_x, scale_y, offset_x, offset_y = compute_transform(nodes, width, height, args.margin, args.fit_mode)
	remapped = transform_nodes(nodes, scale_x, scale_y, offset_x, offset_y)

	overlay = draw_overlay(board, remapped, args.circle_radius, args.thickness, args.font_scale)
	args.output_image.parent.mkdir(parents=True, exist_ok=True)
	cv2.imwrite(str(args.output_image), overlay)

	save_scaled_json(args.output_json, remapped)
	print(f"Overlay written to {args.output_image}")
	print(f"Scaled coordinates saved to {args.output_json}")


if __name__ == "__main__":
	main()

