import Table from 'cli-table';
import table from 'markdown-table';
import colors from 'colors';
import _ from 'lodash';
import jsonpath from 'jsonpath';

/*
This module contains functionality for outputting metric data in tabular form.

Exposed Functionality:

tabulate function - Generates an array of arrays representing a table from a JSON data
object, configurable using a tableOptions object.

consoleTable function - Outputs a string representation of tabulated data, formatted
for console display.

markdownTable function - Outputs a string representation of tabulated data in Markdown format.
*/

export function tabulate({ dataObject, tableOptions, shouldStyle = false }) {
  if (!_.isObject(dataObject)) throw new Error('A data object must be provided');
  if (!_.isArray(tableOptions.tableHeaders)) throw new Error('Table options must include a headers array');
  if (!_.isArray(tableOptions.columns)) throw new Error('Table options must include a columns array');
  if (tableOptions.tableHeaders.length !== tableOptions.columns.length) {
    throw new Error('The number of headers must match the number of columns');
  }

  const HIDE_ROW_INDICATOR = 'HIDE';
  const MISSING_VALUE_INDICATOR = shouldStyle ? colors.red('NO VALUE') : 'NO VALUE';

  const tableHeaders = tableOptions.tableHeaders.map(h => (shouldStyle ? colors.bold(h) : h));

  const getFirstMatch = (obj, path) => {
    let fullPath;
    if (path.startsWith('$')) fullPath = path;
    else if (path.startsWith('.')) fullPath = `$${path}`;
    else fullPath = `$.${path}`;

    return jsonpath.query(obj, fullPath)[0];
  };

  // Get the collection of data from which the table will be constructed
  const collection = tableOptions.collection ?
    getFirstMatch(dataObject, tableOptions.collection) :
    dataObject;

  const getTableRow = (collectionElement) => {
    const getSingleValue = (accessor) => {
      if (_.isObject(accessor)) {
        if (!('datasets' in accessor) || !(_.isString(accessor.datasets) || _.isArray(accessor.datasets))) {
          throw new Error('Dataset(s) must be provided as a path string or an array');
        }
        if (_.isArray(accessor.datasets) && !(('valueTransform' in accessor) || _.isFunction(accessor.valueTransform))) {
          throw new Error('A value transform must be provided when an array of datasets is given');
        }

        let value;
        if (_.isString(accessor.datasets)) {
          value = getFirstMatch(collectionElement, accessor.datasets);
          value = ('valueTransform' in accessor) ? accessor.valueTransform(value) : value;
        } else {
          const datasetRow = accessor.datasets
            .map(path => getFirstMatch(collectionElement, path));
          value = accessor.valueTransform(...datasetRow);
        }

        return (!value && accessor.hideRowIfFalsy) ? HIDE_ROW_INDICATOR : value;
      } else if (_.isString(accessor)) {
        return getFirstMatch(collectionElement, accessor);
      }
      throw new Error('Columns must be objects or strings');
    };

    const valueAccessors = tableOptions.columns;
    const tableRow = valueAccessors.map(getSingleValue);

    return tableRow;
  };

  let tableRows = [];
  if (_.isArray(collection)) {
    tableRows = collection.map(getTableRow);
  } else if (_.isObject(collection)) {
    tableRows = Object.keys(collection).map(key => getTableRow(collection[key]));
  } else {
    throw new Error('The collection must be an array or an object');
  }

  tableRows = tableRows
    .filter(row => !row.some(value => value === HIDE_ROW_INDICATOR))
    .map(row => row.map(value => value || MISSING_VALUE_INDICATOR));

  return _.isEmpty(tableRows) ? [] : [tableHeaders].concat(tableRows);
}

export function consoleTable({ dataObject, tableOptions }) {
  const tableData = tabulate({ shouldStyle: true, tableOptions, dataObject });
  if (_.isEmpty(tableData)) return '';

  const prettyTable = new Table();
  prettyTable.push(...tableData);

  return prettyTable.toString();
}

export function markdownTable({ dataObject, tableOptions }) {
  const tableData = tabulate({ shouldStyle: false, tableOptions, dataObject });
  if (_.isEmpty(tableData)) return '';

  return table(tableData);
}
