export function exportToCSV(data, filename, headers) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  let csv = headers.join(',') + '\n';
  data.forEach(row => {
    const values = headers.map(h => {
      let val = row[h] !== undefined && row[h] !== null ? row[h] : '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csv += values.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
