import { readFile } from 'node:fs/promises';
import type { RequestHandler } from './$types';
import { synchronizeExcel } from '$lib/server/services/excel-service';

export const GET: RequestHandler = async () => {
	const filePath = await synchronizeExcel();
	const contents = await readFile(filePath);
	return new Response(contents, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="Brassers_beheer.xlsx"',
			'Cache-Control': 'private, no-store',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
