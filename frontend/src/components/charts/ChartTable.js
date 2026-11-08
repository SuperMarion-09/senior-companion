/**
 * The numbers behind a chart as a plain table, folded away under
 * "Show as a table". Screen-reader and keyboard users get every value
 * without needing to hover.
 */
export default function ChartTable({ caption, columns, rows }) {
  return (
    <details className="chart-table">
      <summary>Show as a table</summary>
      <table className="data-table chart-table__table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th key={index} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={index}>{cell}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
