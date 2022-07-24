const { Cart } = require('../models/cart-model');
const productService = require('./product-service');

class CartService {
  async findCart(filter) {
    return Cart.findOne(filter).exec();
  }

  async getCartItems(filter) {
    return Cart.findOne(filter).lean().exec();
  }

  async addToCart(user, productInfo, storedProduct) {
    const cart = await this.findCart({ customerId: user._id });

    /* If the cart doesn't exist for this customer id then 
    initialize the cart with the product info. */
    if (!cart) {
      const cartItem = {
        products: [productService.createNewProduct(storedProduct, productInfo)],
        customerId: user._id,
        subtotal: productInfo.quantity * storedProduct.price,
        productsCount: productInfo.quantity,
      };
      return Cart.create({ ...cartItem });
    }

    /* If the cart exist for the customer then check whether the product they want to add to cart exists or not */
    const product = cart.products.find(
      /* GOTCHA : If you don't convert id to string it doesn't matchs */
      (p) => p.productId.toString() === storedProduct._id.toString()
    );

    /* If the product exist update the quantity, totalPrice, products count and subtotal */
    if (product) {
      product.quantity += productInfo.quantity;
      product.totalPrice += productInfo.quantity * storedProduct.price;
      cart.productsCount += productInfo.quantity;
      cart.subtotal += productInfo.quantity * storedProduct.price;
      return cart.save();
    }

    /* If the product doesn't exist create a new one and push it to the products array*/
    const newProduct = productService.createNewProduct(
      storedProduct,
      productInfo
    );
    cart.subtotal += productInfo.quantity * storedProduct.price;
    cart.productsCount += productInfo.quantity;
    cart.products.push(newProduct);
    return cart.save();
  }
}

module.exports = new CartService();
