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
	}, []);

	return <img data-src={src} src="/images/icon-180.png" width={width} height={height} className={className} alt={alt} ref={ref} />;
}
