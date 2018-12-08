const x = require('throw-if-missing');

const populateFilters = (filters, res) => {
    const expandedFilters = {};
    if (filters) {
        Object.keys(filters).forEach((key) => {
            const filter = filters[key];
            if (typeof filter === 'string' && filter.indexOf('$') > -1) {
                const regexedFilter = filter.match(/[a-zA-Z]+/g);
                const dep = regexedFilter[0];
                const depFilter = regexedFilter[1];
                const ent = res.find(r => r.name === dep);
                const mappedFilters = ent.result.map(f => f[depFilter]).filter(val => val != null);
                expandedFilters[key] = mappedFilters;
            } else {
                expandedFilters[key] = filter;
            }
        });
    }
    return expandedFilters;
};

const fetchFetchableEntities = (entities, res) => entities.reduce((acc, ent) => {
    if (ent.resolved) {
        return acc;
    }
    if (ent.deps.length === 0) {
        acc.push({ name: ent.name, promise: ent.entity.getAll(ent.filters) });
    } else {
        let dependenciesMet = 0;
        for (let i = 0; i < ent.deps.length; i++) {
            const depEnt = entities.find(e => e.name === ent.deps[i]);

            if (!depEnt) {
                throw new Error(`Entity ${ent.deps[i]} is a dependency but listed in structures`);
            }
            if (depEnt.resolved === true) {
                dependenciesMet++;
            }
        }

        if (dependenciesMet === ent.deps.length) {
            const filters = populateFilters(ent.filters, res);
            acc.push({ name: ent.name, promise: ent.entity.getAll(filters) });
        }
    }

    return acc;
}, []);

async function fetchEntities(entities) {
    let fetchedEntities = 0;
    const res = [];
    const markResolved = (ent) => {
        const myEnt = entities.find(e => e.name === ent.name);
        myEnt.resolved = true;
    };
    while (fetchedEntities < entities.length) {
        const fetchableEntities = fetchFetchableEntities(entities, res);
        // mark as resolved
        const results = await Promise.all(fetchableEntities.map(fe => fe.promise));
        fetchedEntities += fetchableEntities.length;
        fetchableEntities.forEach(markResolved);
        results.forEach((r, i) => {
            res.push({ name: fetchableEntities[i].name, result: results[i] });
        });
    }
    return res;
}

class SFEntities {
    /**
     * Creates an instance of SFOpportunities.
     * @param params
     * @param params.connection {SFConnection} the SFConnection instance
     * @constructor
     */
    constructor(
        {
            connection = x`connection`,
        }) {
        this.conn = connection;
    }

    /**
     * Gets a single opportunity
     * @param params
     * @param params.structures {Array} the entities to retrieve
     * @param params.filters {Array} filters
     * @returns {Array}
     */
    retrieve(params) {
        const entities = params.structures.map((ent) => {
            // require the entity module
            const Entity = require(`./${ent}`);
            const entity = new Entity({ connection: this.conn });
            // check for filters
            const filters = params.filters[ent];
            const en = { name: ent, filters, deps: [], entity, resolved: false };
            if (filters) {
                // check for external dependencies
                Object.keys(filters).forEach((key) => {
                    const filter = filters[key];
                    if (typeof filter === 'string' && filter.indexOf('$') > -1) {
                        en.deps.push(/[a-zA-Z]+/g.exec(filter)[0]);
                    }
                });
            }
            return en;
        });

        return fetchEntities(entities);
    }
}

module.exports = SFEntities;
