const httpErrors = require('http-errors');
const { Cart } = require('../models/cart-model');
const productService = require('./product-service');
const { REMOVE_FROM_CART, ADD_TO_CART } = require('../constants');

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
      /* GOTCHA : If you don't convert id to string it doesn't matches */
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
    // First get corresponding user's cart.
    const cart = await this.findCart({
      customerId: data.customerId,
    });

    // Loop over the products and find the product customer wants to update.
    // SOME VALIDATION is required.
    // Now update that product details in the cart as per the UPDATE Type.
    let price, product;
    cart.products = cart.products.map((item) => {
      if (item.productId.toString() !== data.productId.toString()) return item;

      if (data.type === REMOVE_FROM_CART && item.quantity < data.quantity)
        throw httpErrors.BadRequest('Maybe next time.');

      if (data.type === REMOVE_FROM_CART && item.quantity - data.quantity < 1)
        throw httpErrors.BadRequest('At least one item should be present.');

      if (data.quantity !== Math.abs(data.quantity))
        throw httpErrors.BadRequest('Maybe next time.');

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

    // If the product doesn't exist throw 404 Error
    if (!product) throw httpErrors.NotFound("Product doesn't exist in cart.");

    // Now update cart metadata as per the UPDATE Type.
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
    // Find the user cart
    const cart = await this.findCart({ customerId });
    // Get the index of the product to remove
    const index = cart.products.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    // GET the product using index access.
    const product = cart.products[index];
    // Throw 404 Error if it doesn't exist
    if (!product) throw httpErrors.NotFound("Product doesn't exist in cart.");

    // Mutate the products array by deleting that product
    cart.products.splice(index, 1);
    // Update cart metadata/
    cart.productsCount -= product.quantity;
    cart.subtotal -= product.totalPrice;
    return cart.save();
  }

  async clearCart(customerId) {
    const cart = await this.findCart({ customerId });
    return cart?.remove();
  }

  checkUserCart(user) {
    const { cart } = user;
    if (cart.cartItems.length === 0 || cart.cartItemsMeta.cartItemsCount === 0)
      throw httpErrors.BadRequest('Cart is empty.');
  }
}

module.exports = new CartService();
