"use client";

import { useEffect, useRef } from "react";

import type { DetailedHTMLProps, ElementRef, ImgHTMLAttributes } from "react";

export function LazyImage({
	src,
	alt,
	className,
	width,
	height,
	ioParams
}: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & {
	ioParams?: IntersectionObserverInit;
}) {
	const ref = useRef<ElementRef<"img">>(null);

	useEffect(() => {
		const node = ref.current;

		const observer = new IntersectionObserver(entries => {
			if (!entries[0].isIntersecting) return;
			if (!node) return;
			if (node.dataset.src) node.src = node.dataset.src;
			observer.unobserve(node);
		}, ioParams);

		if (node) observer.observe(node);

		return () => {
			if (node) observer.unobserve(node);
		};
	}, [ioParams]);

	return (
		<picture>
			<img
				data-src={src}
				src="/images/icon-180.png"
				width={typeof width === "string" ? Number(width) : width || 180}
				height={typeof height === "string" ? Number(height) : height || 180}
				className={className}
				alt={alt || ""}
				ref={ref}
			/>
		</picture>
	);
}
