import {
  __commonJS
} from "./chunk-3OV72XIM.js";

// ../shared/dist/enums.js
var require_enums = __commonJS({
  "../shared/dist/enums.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GOVERNORATES = exports.CodStatus = exports.OrderStatus = void 0;
    exports.OrderStatus = {
      NEW: "NEW",
      PENDING: "PENDING",
      IN_TRANSIT: "IN_TRANSIT",
      DELIVERED: "DELIVERED",
      RETURNED: "RETURNED",
      CANCELLED: "CANCELLED"
    };
    exports.CodStatus = {
      PENDING: "PENDING",
      COLLECTED: "COLLECTED",
      SETTLED: "SETTLED"
    };
    exports.GOVERNORATES = [
      "Cairo",
      "Giza",
      "Alexandria",
      "Qalyubia",
      "Dakahlia",
      "Sharqia",
      "Gharbia",
      "Monufia",
      "Beheira",
      "Kafr El Sheikh",
      "Damietta",
      "Port Said",
      "Ismailia",
      "Suez",
      "Faiyum",
      "Beni Suef",
      "Minya",
      "Asyut",
      "Sohag",
      "Qena",
      "Luxor",
      "Aswan",
      "Red Sea",
      "New Valley",
      "Matrouh",
      "North Sinai",
      "South Sinai"
    ];
  }
});

// ../shared/dist/dto.js
var require_dto = __commonJS({
  "../shared/dist/dto.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../shared/dist/index.js
var require_dist = __commonJS({
  "../shared/dist/index.js"(exports) {
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_enums(), exports);
    __exportStar(require_dto(), exports);
  }
});
export default require_dist();
//# sourceMappingURL=@cod_shared.js.map
