const { Cart } = require('../models/cart-model');
const productService = require('./product-service');
const httpErrors = require('http-errors');
const { REMOVE_FROM_CART, ADD_TO_CART } = require('../utils');

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

  async updateCart(data) {
    const cart = await Cart.findOne({
      customerId: data.customerId,
    });

    let price, product;
    cart.products = cart.products.map((item) => {
      if (item.productId.toString() !== data.productId.toString()) return item;

      if (data.type === REMOVE_FROM_CART && item.quantity < data.quantity)
        throw httpErrors.BadRequest('Bhai kiya kr rha hai tu.');

      if (data.type === REMOVE_FROM_CART && item.quantity - data.quantity < 1)
        throw httpErrors.BadRequest('Atleast one item should be present.');

      if (data.quantity !== Math.abs(data.quantity))
        throw httpErrors.BadRequest('Bhai kiya kr rha hai tu.');

      product = item;
      if (data.type === ADD_TO_CART) {
        price = Number(data.quantity) * (item.totalPrice / item.quantity);
        item.totalPrice += price;
        item.quantity += +data.quantity;
      } else {
        price = Number(data.quantity) * (item.totalPrice / item.quantity);
        item.totalPrice -= price;
        item.quantity -= +data.quantity;
      }

      return item;
    });

    if (!product) throw httpErrors.NotFound("Product doesn't exist in cart.");

    if (data.type === ADD_TO_CART) {
      cart.productsCount += data.quantity;
      cart.subtotal += price;
    } else {
      cart.productsCount -= data.quantity;
      cart.subtotal -= price;
    }
    return cart.save();
  }

  async removeCartItem(customerId, productId) {
    const cart = await Cart.findOne({ customerId }).exec();

    const index = cart.products.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    const product = cart.products[index];
    if (!product) throw httpErrors.NotFound("Product doesn't exist in cart.");

    cart.products.splice(index, 1);
    cart.productsCount -= product.quantity;
    cart.subtotal -= product.totalPrice;
    return cart.save();
  }

  checkUserCart(user) {
    const { cart } = user;
    if (cart.cartItems.length === 0 || cart.cartItemsMeta.cartItemsCount === 0)
      throw httpErrors.BadRequest('Cart is empty.');
  }
}

module.exports = new CartService();
