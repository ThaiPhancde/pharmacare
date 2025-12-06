import { d as defineEventHandler, a as getQuery, I as Invoice } from '../../../_/nitro.mjs';
import 'mongoose';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'zod';
import 'bcryptjs';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const chart = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const year = parseInt(query.year) || (/* @__PURE__ */ new Date()).getFullYear();
    const monthlyData = await Invoice.aggregate([
      {
        $match: {
          date: {
            $gte: /* @__PURE__ */ new Date(`${year}-01-01`),
            $lte: /* @__PURE__ */ new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$date" },
          total: { $sum: "$grand_total" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    const chartData = months.map((name, index) => {
      const monthData = monthlyData.find((item) => item._id === index + 1);
      return {
        name,
        total: monthData ? monthData.total : 0
      };
    });
    return {
      status: true,
      data: chartData,
      message: "L\u1EA5y d\u1EEF li\u1EC7u bi\u1EC3u \u0111\u1ED3 th\xE0nh c\xF4ng"
    };
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return {
      status: false,
      error: "Kh\xF4ng th\u1EC3 l\u1EA5y d\u1EEF li\u1EC7u bi\u1EC3u \u0111\u1ED3"
    };
  }
});

export { chart as default };
//# sourceMappingURL=chart.mjs.map
