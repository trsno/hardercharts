'use client';

import { useEffect, useState } from 'react';
export default function LastSync({ time }: { time: number }) {
	const [date, setDate] = useState<null | string>(null);
	useEffect(() => {
		const timeago = Math.floor((Date.now() - time) / 1e3);
		const lastSync = !timeago
			? 'unknown'
			: timeago < 60
			? `${timeago}s ago`
			: timeago < 3600
			? `${Math.floor(timeago / 60)}m ago`
			: timeago < 216e3
			? `${Math.floor(timeago / 3600)}h ago`
			: `${Math.floor(timeago / 86400)}d ago`;
		setDate(lastSync);
	}, [time]);

	return <>{date && <span className='font-mono text-xs'>lastSync: {date}</span>}</>;
}
