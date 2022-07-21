class CartDto {
  constructor(cart) {
    this.products = cart.products;
    this.total = cart.subtotal;
  }
}

module.exports = CartDto;
