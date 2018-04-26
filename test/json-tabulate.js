import { expect } from 'chai';
import colors from 'colors';
import { tabulate, consoleTable, markdownTable } from '../src/json-tabulate';

describe('tabular-visualizer tests', () => {
  const testHeaders = ['Parsed Size (bytes)', 'Gzipped Size (bytes)', 'Asset'];
  const testColumns = ['parsed', 'gzipped', 'name'];
  const testTableOptions = {
    tableHeaders: testHeaders,
    columns: testColumns,
  };

  const testMetricDataObject = {
    asset1: { name: 'asset1', parsed: 2, gzipped: 1 },
    asset2: { name: 'asset2', parsed: 4, gzipped: 3 },
  };

  describe('tabulate method', () => {
    const row1 = [2, 1, 'asset1'];
    const row2 = [4, 3, 'asset2'];

    it('Returns the metric data object in the form of a table (array of arrays of elements) with unstyled headers', () => {
      const metricDataTable = tabulate({
        dataObject: testMetricDataObject,
        tableOptions: testTableOptions,
        shouldStyle: false,
      });

      expect(metricDataTable).to.have.deep.ordered.members([testHeaders, row1, row2]);
    });

    it('Returns the metric data object in the form of a table (array of arrays of elements) with styled headers', () => {
      const metricDataTable = tabulate({
        dataObject: testMetricDataObject,
        tableOptions: testTableOptions,
        shouldStyle: true,
      });

      expect(metricDataTable)
        .to.have.deep.ordered.members([testHeaders.map(h => colors.bold(h)), row1, row2]);
    });

    it('Inserts an unstyled indicator for metric properties that cannot be found', () => {
      const errorMetricDataObject = {
        asset1: { name: 'asset1', parsed: 2, gzipped: 1 },
        asset2: { name: 'asset2', parsed: '', gzipped: '' },
      };
      const indicator = 'NO VALUE';

      const metricDataTable = tabulate({
        dataObject: errorMetricDataObject,
        tableOptions: testTableOptions,
        assetsShouldStyle: false,
      });

      expect(metricDataTable).to.deep.include([indicator, indicator, 'asset2']);
    });

    it('Inserts a styled indicator for metric properties that cannot be found', () => {
      const errorMetricDataObject = {
        asset1: { name: 'asset1', parsed: 2, gzipped: 1 },
        asset2: { name: 'asset2', parsed: '', gzipped: '' },
      };
      const indicator = colors.red('NO VALUE');

      const metricDataTable = tabulate({
        dataObject: errorMetricDataObject,
        tableOptions: testTableOptions,
        shouldStyle: true,
      });

      expect(metricDataTable).to.deep.include([indicator, indicator, 'asset2']);
    });

    it('Hides a row if one of the values is affected by a \'hideRowIfFalsy\' flag', () => {
      const hiddenRowMetricDataObject = {
        asset1: { name: 'asset1', parsed: 2, gzipped: 1 },
        asset2: { name: 'asset2', parsed: '', gzipped: 3 },
      };
      const hiddenRowTableOpts = {
        tableHeaders: ['Parsed Size (bytes)', 'Gzipped Size (bytes)', 'Asset'],
        columns: ['name', { datasets: 'parsed', hideRowIfFalsy: true }, 'gzipped'],
      };

      const metricDataTable = tabulate({
        dataObject: hiddenRowMetricDataObject,
        tableOptions: hiddenRowTableOpts,
        shouldStyle: true,
      });

      expect(metricDataTable).to.have.lengthOf(2);
    });

    it('Gets a table from a collection within the root object', () => {
      const innerCollectionMetricDataObject = {
        assets: {
          asset1: { name: 'asset1', parsed: 2, gzipped: 1 },
          asset2: { name: 'asset2', parsed: 4, gzipped: 3 },
        },
      };
      const innerCollectionTableOpts = {
        collection: 'assets',
        tableHeaders: testHeaders,
        columns: ['parsed', 'gzipped', 'name'],
      };

      const metricDataTable = tabulate({
        dataObject: innerCollectionMetricDataObject,
        tableOptions: innerCollectionTableOpts,
        shouldStyle: false,
      });

      expect(metricDataTable).to.have.deep.ordered.members([testHeaders, row1, row2]);
    });

    it('Gets a table from a collection within the root object if it is an array', () => {
      const innerCollectionMetricDataObject = {
        assets: [
          { name: 'asset1', parsed: 2, gzipped: 1 },
          { name: 'asset2', parsed: 4, gzipped: 3 },
        ],
      };
      const innerCollectionTableOpts = {
        collection: 'assets',
        tableHeaders: testHeaders,
        columns: ['parsed', 'gzipped', 'name'],
      };

      const metricDataTable = tabulate({
        dataObject: innerCollectionMetricDataObject,
        tableOptions: innerCollectionTableOpts,
        shouldStyle: false,
      });

      expect(metricDataTable).to.have.deep.ordered.members([testHeaders, row1, row2]);
    });

    it('Gets a table from a collection deep within the root object', () => {
      const innerCollectionMetricDataObject = {
        assetInfo: {
          assets: {
            asset1: { name: 'asset1', parsed: 2, gzipped: 1 },
            asset2: { name: 'asset2', parsed: 4, gzipped: 3 },
          },
        },
      };
      const innerCollectionTableOpts = {
        collection: 'assetInfo.assets',
        tableHeaders: testHeaders,
        columns: ['parsed', 'gzipped', 'name'],
      };

      const metricDataTable = tabulate({
        dataObject: innerCollectionMetricDataObject,
        tableOptions: innerCollectionTableOpts,
        shouldStyle: false,
      });

      expect(metricDataTable).to.have.deep.ordered.members([testHeaders, row1, row2]);
    });

    it('Gets a table using properties deep within collection elements', () => {
      const innerCollectionMetricDataObject = {
        assetInfo: {
          assets: {
            asset1: { name: 'asset1', sizeInfo: { parsed: 2, gzipped: 1 } },
            asset2: { name: 'asset2', sizeInfo: { parsed: 4, gzipped: 3 } },
          },
        },
      };
      const innerCollectionTableOpts = {
        collection: '..assets',
        tableHeaders: testHeaders,
        columns: ['sizeInfo.parsed', '..gzipped', 'name'],
      };

      const metricDataTable = tabulate({
        dataObject: innerCollectionMetricDataObject,
        tableOptions: innerCollectionTableOpts,
        shouldStyle: false,
      });

      expect(metricDataTable).to.have.deep.ordered.members([testHeaders, row1, row2]);
    });

    it('Does not insert a header or rows when all rows are empty', () => {
      const emptyRowTableOpts = {
        tableHeaders: ['Parsed Size (bytes)', 'Gzipped Size (bytes)', 'Asset'],
        columns: [{ hideRowIfFalsy: true, datasets: 'notaproperty' }, 'notaproperty', 'notaproperty'],
      };
      const metricDataTable = tabulate({
        dataObject: testMetricDataObject,
        tableOptions: emptyRowTableOpts,
        shouldStyle: true,
      });

      expect(metricDataTable).to.be.empty;
    });

    it('Applies the value transform to each row tuple given a list of datasets', () => {
      const emptyRowTableOpts = {
        tableHeaders: ['Difference', 'Asset'],
        columns: [
          { datasets: ['parsed', 'gzipped'], valueTransform: (parsed, gzipped) => parsed - gzipped },
          'name',
        ],
      };
      const expTable = [['Difference', 'Asset'], [1, 'asset1'], [1, 'asset2']];
      const metricDataTable = tabulate({
        dataObject: testMetricDataObject,
        tableOptions: emptyRowTableOpts,
        shouldStyle: false,
      });

      expect(metricDataTable).to.eql(expTable);
    });

    it('Applies the value transform to each dataset element if a single dataset path is given', () => {
      const emptyRowTableOpts = {
        tableHeaders: ['Parsed + 5', 'Asset'],
        columns: [
          { datasets: 'parsed', valueTransform: parsed => parsed + 5 },
          'name',
        ],
      };
      const expTable = [['Parsed + 5', 'Asset'], [7, 'asset1'], [9, 'asset2']];
      const metricDataTable = tabulate({
        dataObject: testMetricDataObject,
        tableOptions: emptyRowTableOpts,
        shouldStyle: false,
      });

      expect(metricDataTable).to.eql(expTable);
    });

    it('Throws an error if one of the columns is not a string or an object', () => {
      const errorTableOpts = {
        tableHeaders: ['Parsed Size (bytes)', 'Gzipped Size (bytes)', 'Asset'],
        columns: [() => {}, 'notaproperty', 'notaproperty'],
      };

      expect(() => tabulate({
        dataObject: testMetricDataObject,
        tableOptions: errorTableOpts,
        shouldStyle: true,
      })).to.throw();
    });

    it('Throws an error if the table options do not contain headers', () => {
      const errorTableOpts = {
        columns: ['notaproperty', 'notaproperty', 'notaproperty'],
      };

      expect(() => tabulate({
        dataObject: testMetricDataObject,
        tableOptions: errorTableOpts,
        shouldStyle: true,
      })).to.throw();
    });

    it('Throws an error if the table options do not contain columns', () => {
      const errorTableOpts = {
        tableHeaders: ['Parsed Size (bytes)', 'Gzipped Size (bytes)', 'Asset'],
      };

      expect(() => tabulate({
        dataObject: testMetricDataObject,
        tableOptions: errorTableOpts,
        shouldStyle: true,
      })).to.throw();
    });

    it('Throws an error if the number of headers does not match the number of columns', () => {
      const errorTableOpts = {
        tableHeaders: ['Parsed Size (bytes)', 'Gzipped Size (bytes)', 'Asset'],
        columns: ['notaproperty', 'notaproperty'],
      };

      expect(() => tabulate({
        dataObject: testMetricDataObject,
        tableOptions: errorTableOpts,
        shouldStyle: true,
      })).to.throw();
    });

    it('Throws an error if a column is an object without a \'datasets\' property', () => {
      const errorTableOpts = {
        tableHeaders: ['Parsed Size (bytes)', 'Gzipped Size (bytes)', 'Asset'],
        columns: [{ valueTransform: () => {} }, 'notaproperty'],
      };

      expect(() => tabulate({
        dataObject: testMetricDataObject,
        tableOptions: errorTableOpts,
        shouldStyle: true,
      })).to.throw();
    });

    it('Throws an error if a column has a \'datasets\' array and no value transform function', () => {
      const errorTableOpts = {
        tableHeaders: ['Parsed Size (bytes)', 'Gzipped Size (bytes)', 'Asset'],
        columns: [
          { datasets: ['notaproperty1', 'notaproperty2'] },
          'notaproperty',
          'notaproperty',
        ],
      };

      expect(() => tabulate({
        dataObject: testMetricDataObject,
        tableOptions: errorTableOpts,
        shouldStyle: true,
      })).to.throw();
    });

    it('Throws an error if the collection is not an array or an object', () => {
      const errorMetricDataObject = {
        assets: 'assets',
      };
      const errorTableOpts = {
        collection: 'assets',
        tableHeaders: ['Parsed Size (bytes)', 'Gzipped Size (bytes)', 'Asset'],
        columns: ['parsed', 'gzipped', 'name'],
      };

      expect(() => tabulate({
        dataObject: errorMetricDataObject,
        tableOptions: errorTableOpts,
        shouldStyle: true,
      })).to.throw();
    });
  });

  describe('prettyPrint method', () => {
    it('Returns the metric data object in the form of a prettified string', () => {
      const consoleTableOutput = consoleTable({
        dataObject: testMetricDataObject,
        tableOptions: testTableOptions,
      });

      expect(consoleTableOutput).to.be.a('string');
    });
  });

  describe('toMarkdown method', () => {
    it('Returns the metric data object in the form of a Markdown string', () => {
      const expMarkdownTable = `| Parsed Size (bytes) | Gzipped Size (bytes) | Asset  |
| ------------------- | -------------------- | ------ |
| 2                   | 1                    | asset1 |
| 4                   | 3                    | asset2 |`;

      const markdownTableOutput = markdownTable({
        dataObject: testMetricDataObject,
        tableOptions: testTableOptions,
      });

      expect(markdownTableOutput).to.equal(expMarkdownTable);
    });
  });
  // });
});
