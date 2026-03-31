const logger = require('./logger');

/* * 
* Common database operation base class 
* Provide standard CRUD operations and error handling */
class BaseRepository {
    constructor(db, tableName) {
        this.db = db;
        this.tableName = tableName;
    }

    /* * 
* Query all records 
* @param {Object} options - query options 
* @param {Object} options.filters - filter conditions 
* @param {string} options.orderBy - sorting field 
* @param {number} options.limit - limit number 
* @param {number} options.offset - offset 
* @returns {Array} query results */
    findAll(options = {}) {
        const { filters = {}, orderBy, limit, offset } = options;
        
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        
        // Build WHERE conditions
        const whereConditions = [];
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                whereConditions.push(`${key} = ?`);
                params.push(value);
            }
        });
        
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        // Add sort
        if (orderBy) {
            query += ` ORDER BY ${orderBy}`;
        }
        
        // Add pagination
        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit);
            
            if (offset) {
                query += ` OFFSET ?`;
                params.push(offset);
            }
        }
        
        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    /* * 
* Query a single record based on ID 
* @param {number|string} id - record ID 
* @param {string} idField - ID field name, default is 'id' 
* @returns {Object|null} query results */
    findById(id, idField = 'id') {
        const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${idField} = ?`);
        return stmt.get(id);
    }

    /* * 
* Query a single record based on conditions 
* @param {Object} filters - filter conditions 
* @returns {Object|null} query results */
    findOne(filters = {}) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        
        const whereConditions = [];
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                whereConditions.push(`${key} = ?`);
                params.push(value);
            }
        });
        
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        query += ' LIMIT 1';
        
        const stmt = this.db.prepare(query);
        return stmt.get(...params);
    }

    /* * 
* Create new record 
* @param {Object} data - the data to be inserted 
* @returns {Object} insertion result, including lastInsertRowid */
    create(data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map(() => '?').join(', ');
        
        const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const stmt = this.db.prepare(query);
        
        return stmt.run(...values);
    }

    /* * 
* Create records in batches 
* @param {Array} dataArray - the data array to be inserted 
* @returns {Array} Insert result array */
    createMany(dataArray) {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return [];
        }
        
        const fields = Object.keys(dataArray[0]);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        
        const stmt = this.db.prepare(query);
        const transaction = this.db.transaction((items) => {
            const results = [];
            for (const item of items) {
                const values = fields.map(field => item[field]);
                results.push(stmt.run(...values));
            }
            return results;
        });
        
        return transaction(dataArray);
    }

    /* * 
* Update record 
* @param {number|string} id - record ID 
* @param {Object} data - the data to be updated 
* @param {string} idField - ID field name, default is 'id' 
* @returns {Object} update results */
    update(id, data, idField = 'id') {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        
        const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${idField} = ?`;
        const stmt = this.db.prepare(query);
        
        return stmt.run(...values, id);
    }

    /* * 
* Update records based on conditions 
* @param {Object} filters - filter conditions 
* @param {Object} data - the data to be updated 
* @returns {Object} update results */
    updateWhere(filters, data) {
        const updateFields = Object.keys(data);
        const updateValues = Object.values(data);
        const setClause = updateFields.map(field => `${field} = ?`).join(', ');
        
        const whereConditions = [];
        const whereValues = [];
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                whereConditions.push(`${key} = ?`);
                whereValues.push(value);
            }
        });
        
        if (whereConditions.length === 0) {
            throw new Error('Update without WHERE conditions is not allowed');
        }
        
        const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereConditions.join(' AND ')}`;
        const stmt = this.db.prepare(query);
        
        return stmt.run(...updateValues, ...whereValues);
    }

    /* * 
* Delete record 
* @param {number|string} id - record ID 
* @param {string} idField - ID field name, default is 'id' 
* @returns {Object} Delete results */
    delete(id, idField = 'id') {
        const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE ${idField} = ?`);
        return stmt.run(id);
    }

    /* * 
* Delete records based on conditions 
* @param {Object} filters - filter conditions 
* @returns {Object} Delete results */
    deleteWhere(filters) {
        const whereConditions = [];
        const whereValues = [];
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                whereConditions.push(`${key} = ?`);
                whereValues.push(value);
            }
        });
        
        if (whereConditions.length === 0) {
            throw new Error('Delete without WHERE conditions is not allowed');
        }
        
        const query = `DELETE FROM ${this.tableName} WHERE ${whereConditions.join(' AND ')}`;
        const stmt = this.db.prepare(query);
        
        return stmt.run(...whereValues);
    }

    /* * 
*Number of statistical records 
* @param {Object} filters - filter conditions 
* @returns {number} number of records */
    count(filters = {}) {
        let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const params = [];
        
        const whereConditions = [];
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                whereConditions.push(`${key} = ?`);
                params.push(value);
            }
        });
        
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        const stmt = this.db.prepare(query);
        const result = stmt.get(...params);
        return result.count;
    }

    /* * 
* Check if the record exists 
* @param {Object} filters - filter conditions 
* @returns {boolean} whether it exists */
    exists(filters) {
        return this.count(filters) > 0;
    }

    /* * 
* Execute transaction 
* @param {Function} callback - transaction callback function 
* @returns {*} Transaction results */
    transaction(callback) {
        const transaction = this.db.transaction(callback);
        return transaction();
    }
}

module.exports = BaseRepository;
