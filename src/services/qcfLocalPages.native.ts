type PageBundle = Record<string, unknown>;

/** Loads only the 13-page bundle needed by the current native Mushaf page. */
export function getBundledQpcPage(page: number): unknown | null {
  if (!Number.isInteger(page) || page < 1 || page > 604) return null;

  const group = Math.ceil(page / 13);
  let pages: PageBundle;

  switch (group) {
    case 1: pages = require('../../assets/qcf-pages/group-01.json'); break;
    case 2: pages = require('../../assets/qcf-pages/group-02.json'); break;
    case 3: pages = require('../../assets/qcf-pages/group-03.json'); break;
    case 4: pages = require('../../assets/qcf-pages/group-04.json'); break;
    case 5: pages = require('../../assets/qcf-pages/group-05.json'); break;
    case 6: pages = require('../../assets/qcf-pages/group-06.json'); break;
    case 7: pages = require('../../assets/qcf-pages/group-07.json'); break;
    case 8: pages = require('../../assets/qcf-pages/group-08.json'); break;
    case 9: pages = require('../../assets/qcf-pages/group-09.json'); break;
    case 10: pages = require('../../assets/qcf-pages/group-10.json'); break;
    case 11: pages = require('../../assets/qcf-pages/group-11.json'); break;
    case 12: pages = require('../../assets/qcf-pages/group-12.json'); break;
    case 13: pages = require('../../assets/qcf-pages/group-13.json'); break;
    case 14: pages = require('../../assets/qcf-pages/group-14.json'); break;
    case 15: pages = require('../../assets/qcf-pages/group-15.json'); break;
    case 16: pages = require('../../assets/qcf-pages/group-16.json'); break;
    case 17: pages = require('../../assets/qcf-pages/group-17.json'); break;
    case 18: pages = require('../../assets/qcf-pages/group-18.json'); break;
    case 19: pages = require('../../assets/qcf-pages/group-19.json'); break;
    case 20: pages = require('../../assets/qcf-pages/group-20.json'); break;
    case 21: pages = require('../../assets/qcf-pages/group-21.json'); break;
    case 22: pages = require('../../assets/qcf-pages/group-22.json'); break;
    case 23: pages = require('../../assets/qcf-pages/group-23.json'); break;
    case 24: pages = require('../../assets/qcf-pages/group-24.json'); break;
    case 25: pages = require('../../assets/qcf-pages/group-25.json'); break;
    case 26: pages = require('../../assets/qcf-pages/group-26.json'); break;
    case 27: pages = require('../../assets/qcf-pages/group-27.json'); break;
    case 28: pages = require('../../assets/qcf-pages/group-28.json'); break;
    case 29: pages = require('../../assets/qcf-pages/group-29.json'); break;
    case 30: pages = require('../../assets/qcf-pages/group-30.json'); break;
    case 31: pages = require('../../assets/qcf-pages/group-31.json'); break;
    case 32: pages = require('../../assets/qcf-pages/group-32.json'); break;
    case 33: pages = require('../../assets/qcf-pages/group-33.json'); break;
    case 34: pages = require('../../assets/qcf-pages/group-34.json'); break;
    case 35: pages = require('../../assets/qcf-pages/group-35.json'); break;
    case 36: pages = require('../../assets/qcf-pages/group-36.json'); break;
    case 37: pages = require('../../assets/qcf-pages/group-37.json'); break;
    case 38: pages = require('../../assets/qcf-pages/group-38.json'); break;
    case 39: pages = require('../../assets/qcf-pages/group-39.json'); break;
    case 40: pages = require('../../assets/qcf-pages/group-40.json'); break;
    case 41: pages = require('../../assets/qcf-pages/group-41.json'); break;
    case 42: pages = require('../../assets/qcf-pages/group-42.json'); break;
    case 43: pages = require('../../assets/qcf-pages/group-43.json'); break;
    case 44: pages = require('../../assets/qcf-pages/group-44.json'); break;
    case 45: pages = require('../../assets/qcf-pages/group-45.json'); break;
    case 46: pages = require('../../assets/qcf-pages/group-46.json'); break;
    case 47: pages = require('../../assets/qcf-pages/group-47.json'); break;
    default: return null;
  }

  return pages[String(page)] ?? null;
}
