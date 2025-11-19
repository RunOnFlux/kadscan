// @ts-ignore
import { convertArrayToCSV } from 'convert-array-to-csv'

function flatObjectToString(obj: any) {
  var s = "";
  Object.keys(obj).map(key => {
    if (obj[key] === null) {
      s += key + ":";
    } else if (obj[key].toLocaleDateString) {
      s += key + ": " + obj[key].toLocaleDateString() + "\n";
    } else if (obj[key] instanceof Array) {
      s += key + ":\n" + listToFlatString(obj[key]);
    } else if (typeof obj[key] == "object") {
      s += key + ":\n" + flatObjectToString(obj[key]);
    } else {
      s += key + ":" + obj[key];
    }
    s += "\n";
  });
  return s;
}

function listToFlatString(list: any[]) {
  var s = "";
  list.map((item: any) => {
    Object.keys(item).map(key => {
      s += "";
      if (item[key] instanceof Array) {
        s += key + "\n" + listToFlatString(item[key]);
      } else if (typeof item[key] == "object" && item[key] !== null) {
        s += key + ": " + flatObjectToString(item[key]);
      } else {
        s += key + ": " + (item[key] === null ? "" : item[key].toLocaleDateString ? item[key].toLocaleDateString : item[key].toString());
      }
      s += "\n";
    });
  });
  return s;
}

function flatten(object: any, addToList: any, prefix: any) {
  Object.keys(object).map(key => {
      if (object[key] === null) {
          addToList[prefix + key] = "";
      } else
      if (object[key] instanceof Array) {
          // addToList[prefix + key] = listToFlatString(object[key]);
          for (const i in object[key]) {
              flatten(object[key][i], addToList, prefix + key + "." + i + '.')
          }
      } else if (typeof object[key] == 'object' && !object[key].toLocaleDateString) {
          flatten(object[key], addToList, prefix + key + '.');
      } else {
          addToList[prefix + key] = object[key];
      }
  });
  return addToList;
}

export function exportableToCsv(data: any[], headers: any[]) {
  const header = headers.map(h => h.label);
  const body = data.map(item => {
    return headers.map(header => {
      return item[header.key];
    });
  });

  return convertArrayToCSV(body, {
    header,
    separator: ','
  });
}

export function transactionToCsv({ transaction, transfers, events }: any) {
  const flattenedData = flatten({
    ...transaction,
    events,
    transfers: transfers.map(({ transfer }: any) => transfer),
  }, {}, '');

  const csv = convertArrayToCSV([flattenedData])

  return csv;
}

export function blockToCsv(block: any) {
  const flattenedData = flatten(block, {}, '');


  const csv = convertArrayToCSV([flattenedData])

  return csv;
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if ((navigator as any).msSaveBlob) { // IE 10+
    (navigator as any).msSaveBlob(blob, filename);
  } else {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}


