class CartDto {
  constructor(cart) {
    this.cartId = cart._id;
    this.customerId = cart.customerId;
    this.products = cart.products;
    this.totalProductsCount = cart.productsCount;
    this.totalPrice = cart.subtotal;
  }
}

module.exports = CartDto;
