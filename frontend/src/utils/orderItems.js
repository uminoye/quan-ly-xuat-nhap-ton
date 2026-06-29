export function normalizeOrderItems(order) {
  const items = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.products)
      ? order.products
      : Array.isArray(order?.order_items)
        ? order.order_items
        : [];

  return items.map((item, index) => ({
    id: item.id ?? `${order?.id ?? 'order'}-${item.product_id ?? index}`,
    product_id: item.product_id ?? item.id ?? item.product?.id,
    product_name:
      item.product_name ??
      item.name ??
      item.product?.name ??
      item.product?.product_name ??
      item.product_title ??
      item.productName ??
      item.product?.title ??
      item.product?.product_title ??
      item.product?.productName ??
      'Sản phẩm không tên',
    product_sku: item.product_sku ?? item.sku ?? item.product?.sku ?? item.product?.product_sku ?? '',
    quantity: Number(item.quantity ?? item.qty ?? item.product_quantity ?? 0),
  }));
}

export function formatOrderItems(order) {
  const items = normalizeOrderItems(order);
  if (!items.length) return 'Chưa có sản phẩm';

  return items
    .map((item) => `${item.product_name}${item.product_sku ? ` (${item.product_sku})` : ''} x${item.quantity}`)
    .join(', ');
}
