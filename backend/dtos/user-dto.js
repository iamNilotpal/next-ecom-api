class UserDto {
  constructor(user) {
    this.id = user._id;
    this.fullName = user.fullName;
    this.email = user.email;
    this.cart = user.cart;
    this.purchasedProducts = user.purchasedProducts;
    this.address = user.address;
    this.createdAt = user.createdAt;
  }
}

module.exports = UserDto;
