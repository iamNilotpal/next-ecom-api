class UserDto {
  constructor(user) {
    this.id = user._id;
    this.fullName = user.fullName;
    this.email = user.email;
    this.cart = user.cart;
    this.purchasedItems = user.purchasedItems;
    this.address = user.address;
    this.createAt = user.createAt;
  }
}

module.exports = UserDto;
