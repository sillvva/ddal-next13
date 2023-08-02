import Link from "next/link";
import { mdiHome } from "@mdi/js";
import Icon from "@mdi/react";

export function BreadCrumbs({ crumbs }: { crumbs: { name: string; href?: string }[] }) {
	const items = crumbs.map((bc, i) => ({
		name: bc.name,
		href: !bc.href || i === crumbs.length - 1 ? null : bc.href
	}));

	return (
		<div className="breadcrumbs mb-4 hidden flex-1 text-sm sm:flex">
			<ul>
				<li>
					<Icon path={mdiHome} className="w-4" />
				</li>
				{items.map(bc =>
					bc.href ? (
						<li key={bc.name}>
							<Link href={bc.href} className="text-secondary">
								{bc.name}
							</Link>
						</li>
					) : (
						<li className="overflow-hidden text-ellipsis whitespace-nowrap dark:drop-shadow-md" key={bc.name}>
							{bc.name}
						</li>
					)
				)}
			</ul>
		</div>
	);
}
