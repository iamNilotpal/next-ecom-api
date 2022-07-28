class ProductDto {
  constructor(product) {
    this.id = product._id;
    this.title = product.name;
    this.price = product.price;
    this.description = product.description;
    this.imageURL = product.image;
    this.ratings = product.rating;
  }
}

module.exports = ProductDto;
