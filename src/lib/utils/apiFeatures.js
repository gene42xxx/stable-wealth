import mongoose from 'mongoose';

/**
 * Utility class to handle API features like filtering, sorting, field limiting,
 * pagination, and searching for Mongoose queries.
 */
export default class APIFeatures {
  /**
   * @param {mongoose.Query} query - The Mongoose query object (e.g., Model.find()).
   * @param {URLSearchParams | object} queryString - The query string parameters from the request URL (can be URLSearchParams or a plain object).
   */
  constructor(query, queryString) {
    this.query = query;
    // Convert URLSearchParams to a plain object if necessary
    if (queryString instanceof URLSearchParams) {
      this.queryString = Object.fromEntries(queryString.entries());
    } else {
      this.queryString = queryString;
    }
  }

  /**
   * Applies filtering based on query string parameters.
   * Excludes special parameters like page, sort, limit, fields, search.
   * Handles MongoDB comparison operators ($gte, $gt, $lte, $lt, $in, $regex).
   * @returns {APIFeatures} The instance for chaining.
   */
  filter() {
    const queryObj = { ...this.queryString };
    // Exclude special parameters used for API control, not DB filtering
    const excludedFields = ["page", "sort", "limit", "fields", "search", "action"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering: gte, gt, lte, lt, in, regex
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|in|regex)\b/g,
      (match) => `$${match}`
    );

    // Special handling for boolean values if needed (e.g., ?isActive=true)
    // This basic implementation assumes string/number values primarily.
    // You might need to parse boolean strings explicitly if they cause issues.

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
    * Applies sorting based on the 'sort' query string parameter.
    * Defaults to sorting by '-createdAt' if 'sort' is not provided.
    * @returns {APIFeatures} The instance for chaining.
    */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort order if none specified
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  /**
   * Limits the fields returned in the query results based on the 'fields' query string parameter.
   * Defaults to excluding '__v' if 'fields' is not provided.
   * @returns {APIFeatures} The instance for chaining.
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // Default field limiting (exclude Mongoose version key)
      this.query = this.query.select("-__v");
    }
    return this;
  }

  /**
   * Applies pagination based on 'page' and 'limit' query string parameters.
   * Defaults to page 1 and limit 100 if not provided.
   * @returns {APIFeatures} The instance for chaining.
   */
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 100; // Default limit
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  /**
   * Applies search functionality using regex on specified fields based on the 'search' query string parameter.
   * @param {string[]} searchFields - An array of field names to search against.
   * @returns {APIFeatures} The instance for chaining.
   */
  search(searchFields = []) {
    if (this.queryString.search && searchFields.length > 0) {
      const searchTerm = this.queryString.search;
      const regex = new RegExp(searchTerm, 'i'); // Case-insensitive regex

      // Check if the base query already has conditions
      const existingQuery = this.query.getFilter();

      // Build the $or condition for search fields
      const searchCondition = {
        $or: searchFields.map(field => ({ [field]: { $regex: regex } }))
      };

      // Combine with existing query conditions using $and
      // Ensure existingQuery is not empty before attempting to combine
      if (Object.keys(existingQuery).length > 0) {
        this.query.and([existingQuery, searchCondition]);
      } else {
        // Apply search condition directly if no prior filters
        this.query.find(searchCondition);
      }
    }
    return this;
  }
}
