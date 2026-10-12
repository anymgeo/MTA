"""Read-only extraction: source files are never modified."""
import json
from pathlib import Path
import openpyxl
import sys

directory = Path(r'D:\OneDrive - Mountain Resorts Georgia\Desktop\ტრასები')
for path in sorted(directory.glob('*.xlsx')):
    if len(sys.argv)>1 and sys.argv[1] not in path.name:
        continue
    wb = openpyxl.load_workbook(path, data_only=True)
    print(json.dumps({'file': path.name, 'sheets': wb.sheetnames}, ensure_ascii=False))
    for sheet in wb:
        for row in sheet:
            cells = []
            for cell in row:
                if cell.value is not None:
                    cells.append(f'{cell.coordinate}={cell.value}')
            if cells:
                print(json.dumps({'sheet':sheet.title,'row':row[0].row,'cells':cells}, ensure_ascii=False, default=str))
