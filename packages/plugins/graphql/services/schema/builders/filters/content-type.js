'use strict';

const { inputObjectType } = require('nexus');

const { utils, mappers } = require('../../../types');
const operators = require('./operators');

const rootLevelOperators = [operators.and, operators.or, operators.not];

function buildContentTypeFilters(contentType) {
  const { attributes } = contentType;

  const filtersTypeName = utils.getFiltersInputTypeName(contentType);

  return inputObjectType({
    name: filtersTypeName,

    definition(t) {
      // Add every defined attribute
      for (const [attributeName, attribute] of Object.entries(attributes)) {
        // Handle scalars
        if (utils.isStrapiScalar(attribute)) {
          addScalarAttribute(t, attributeName, attribute);
        }

        // Handle relations
        else if (utils.isRelation(attribute) || utils.isMedia(attribute)) {
          addRelationalAttribute(t, attributeName, attribute);
        }
      }

      // Conditional clauses
      for (const operator of rootLevelOperators) {
        operator.add(t, filtersTypeName);
      }
    },
  });
}

const addScalarAttribute = (builder, attributeName, attribute) => {
  const gqlType = mappers.strapiScalarToGraphQLScalar(attribute.type);

  builder.field(attributeName, { type: utils.getScalarFilterInputTypeName(gqlType) });
};

const addRelationalAttribute = (builder, attributeName, attribute) => {
  const model = strapi.getModel(attribute.target);

  // If there is no model corresponding to the attribute configuration
  // or if the attribute is a polymorphic relation or a media, then ignore it
  if (!model || utils.isMorphRelation(attribute) || utils.isMedia(attribute)) return;

  builder.field(attributeName, { type: utils.getFiltersInputTypeName(model) });
};

module.exports = {
  buildContentTypeFilters,
};
