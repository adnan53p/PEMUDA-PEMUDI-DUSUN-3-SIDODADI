/**
 * Formatter bersama untuk tampilan mata uang publik.
 * Data keuangan publik tidak disimpan di file ini.
 * Seluruh angka pada /keuangan harus berasal dari OperationsContext / sumber transaksi yang sama.
 */
export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
