import type { NavMenu, NavMenuItems } from "@/types/nav";

export const navMenu: NavMenu[] = [
  {
    heading: "",
    items: [
      {
        title: "Home",
        icon: "i-lucide-home",
        link: "/",
      },
      {
        title: "Supplier",
        icon: "i-lucide-user",
        link: "/suppliers",
      },
      {
        title: "Customer",
        icon: "i-lucide-users",
        link: "/customers",
      },
      {
        title: "Medicine",
        icon: "i-lucide-pill",
        children: [
          {
            title: "Category",
            link: "/medicine/category",
          },
          {
            title: "Unit",
            link: "/medicine/unit",
          },
          {
            title: "Type",
            link: "/medicine/type",
          },
          {
            title: "Medicine",
            link: "/medicine",
          },
        ],
      },
      {
        title: "Stock",
        icon: "i-lucide-package-search",
        children: [
          {
            title: "All Stock",
            link: "/stock",
          },
          {
            title: "Expiring Medicines",
            link: "/stock/expiring",
            new: true,
          },
        ]
      },
      {
        title: "Purchase",
        icon: "i-lucide-shopping-cart",
        link: "/purchase"
      },
      {
        title: "Bank",
        icon: "i-lucide-credit-card",
        children: [
          {
            title: "Manage Banks",
            link: "/bank",
          },
          {
            title: "Payment QR",
            link: "/bank/payment",
          },
        ],
      },
      {
        title: "Invoice",
        icon: "i-lucide-receipt",
        children: [
          {
            title: "POS Invoice",
            link: "/invoice/pos",
          },
          {
            title: "Invoice List",
            link: "/invoice",
          },
        ],
      },
      {
        title: "Shipping",
        icon: "i-lucide-truck",
        children: [
          {
            title: "Create Shipping",
            link: "/shipping",
          },
          {
            title: "Track Order",
            link: "/shipping/track",
          },
        ],
        new: true,
      },
      {
        title: "Returns",
        icon: "i-lucide-rotate-ccw",
        link: "/returns",
        new: true,
      },
      {
        title: "Voucher",
        icon: "i-lucide-ticket",
        link: "/voucher",
        new: true,
      },
      {
        title: "Report",
        icon: "i-lucide-bar-chart-3",
        children: [
          // {
          //   title: "Sales Report",
          //   link: "/report/sales",
          // },
          // {
          //   title: "Purchase Report",
          //   link: "/report/purchase",
          // },
          // {
          //   title: "Product Wise Sales",
          //   link: "/report/product-sales",
          // },
          // {
          //   title: "Category Wise Sales",
          //   link: "/report/category-sales",
          // },
          // {
          //   title: "User Wise Sales",
          //   link: "/report/user-sales",
          // },
          {
            title: "Shift Closing",
            link: "/report/shift-closing",
            new: true,
          },
          // {
          //   title: "Closing List",
          //   link: "/report/closing",
          // },
        ],
        new: true,
      },
      {
        title: "Human Resource",
        icon: "i-lucide-users-round",
        children: [
          {
            title: "Employee",
            link: "/hr/employee",
          },
          // {
          //   title: "Attendance",
          //   link: "/hr/attendance",
          // },
          {
            title: "Shift Management",
            link: "/hr/shift",
          },
          // {
          //   title: "Payroll",
          //   link: "/hr/payroll",
          // },
          // {
          //   title: "Benefits",
          //   link: "/hr/benefits",
          // },
          // {
          //   title: "Expense",
          //   link: "/hr/expense",
          // },
        ],
        new: true,
      },
    ],
  },
  // {
  //   heading: "Components",
  //   items: [
  //     {
  //       title: "Components",
  //       icon: "i-lucide-component",
  //       children: [
  //         {
  //           title: "Accordion",
  //           icon: "i-lucide-circle",
  //           link: "/components/accordion",
  //         },
  //         {
  //           title: "Alert",
  //           icon: "i-lucide-circle",
  //           link: "/components/alert",
  //         },
  //         {
  //           title: "Alert Dialog",
  //           icon: "i-lucide-circle",
  //           link: "/components/alert-dialog",
  //         },
  //         {
  //           title: "Aspect Ratio",
  //           icon: "i-lucide-circle",
  //           link: "/components/aspect-ratio",
  //         },
  //         {
  //           title: "Avatar",
  //           icon: "i-lucide-circle",
  //           link: "/components/avatar",
  //         },
  //         {
  //           title: "Badge",
  //           icon: "i-lucide-circle",
  //           link: "/components/badge",
  //         },
  //         {
  //           title: "Breadcrumb",
  //           icon: "i-lucide-circle",
  //           link: "/components/breadcrumb",
  //         },
  //         {
  //           title: "Button",
  //           icon: "i-lucide-circle",
  //           link: "/components/button",
  //         },
  //         {
  //           title: "Calendar",
  //           icon: "i-lucide-circle",
  //           link: "/components/calendar",
  //         },
  //         {
  //           title: "Card",
  //           icon: "i-lucide-circle",
  //           link: "/components/card",
  //         },
  //         {
  //           title: "Carousel",
  //           icon: "i-lucide-circle",
  //           link: "/components/carousel",
  //         },
  //         {
  //           title: "Checkbox",
  //           icon: "i-lucide-circle",
  //           link: "/components/checkbox",
  //         },
  //         {
  //           title: "Collapsible",
  //           icon: "i-lucide-circle",
  //           link: "/components/collapsible",
  //         },
  //         {
  //           title: "Combobox",
  //           icon: "i-lucide-circle",
  //           link: "/components/combobox",
  //         },
  //         {
  //           title: "Command",
  //           icon: "i-lucide-circle",
  //           link: "/components/command",
  //         },
  //         {
  //           title: "Context Menu",
  //           icon: "i-lucide-circle",
  //           link: "/components/context-menu",
  //         },
  //         {
  //           title: "Dialog",
  //           icon: "i-lucide-circle",
  //           link: "/components/dialog",
  //         },
  //         {
  //           title: "Drawer",
  //           icon: "i-lucide-circle",
  //           link: "/components/drawer",
  //         },
  //         {
  //           title: "Dropdown Menu",
  //           icon: "i-lucide-circle",
  //           link: "/components/dropdown-menu",
  //         },
  //         {
  //           title: "Form",
  //           icon: "i-lucide-circle",
  //           link: "/components/form",
  //         },
  //         {
  //           title: "Hover Card",
  //           icon: "i-lucide-circle",
  //           link: "/components/hover-card",
  //         },
  //         {
  //           title: "Input",
  //           icon: "i-lucide-circle",
  //           link: "/components/input",
  //         },
  //         {
  //           title: "Label",
  //           icon: "i-lucide-circle",
  //           link: "/components/label",
  //         },
  //         {
  //           title: "Menubar",
  //           icon: "i-lucide-circle",
  //           link: "/components/menubar",
  //         },
  //         {
  //           title: "Navigation Menu",
  //           icon: "i-lucide-circle",
  //           link: "/components/navigation-menu",
  //         },
  //         {
  //           title: "Number Field",
  //           icon: "i-lucide-circle",
  //           link: "/components/number-field",
  //         },
  //         {
  //           title: "Pagination",
  //           icon: "i-lucide-circle",
  //           link: "/components/pagination",
  //         },
  //         {
  //           title: "PIN Input",
  //           icon: "i-lucide-circle",
  //           link: "/components/pin-input",
  //         },
  //         {
  //           title: "Popover",
  //           icon: "i-lucide-circle",
  //           link: "/components/popover",
  //         },
  //         {
  //           title: "Progress",
  //           icon: "i-lucide-circle",
  //           link: "/components/progress",
  //         },
  //         {
  //           title: "Radio Group",
  //           icon: "i-lucide-circle",
  //           link: "/components/radio-group",
  //         },
  //         {
  //           title: "Range Calendar",
  //           icon: "i-lucide-circle",
  //           link: "/components/range-calendar",
  //         },
  //         {
  //           title: "Resizable",
  //           icon: "i-lucide-circle",
  //           link: "/components/resizable",
  //         },
  //         {
  //           title: "Scroll Area",
  //           icon: "i-lucide-circle",
  //           link: "/components/scroll-area",
  //         },
  //         {
  //           title: "Select",
  //           icon: "i-lucide-circle",
  //           link: "/components/select",
  //         },
  //         {
  //           title: "Separator",
  //           icon: "i-lucide-circle",
  //           link: "/components/separator",
  //         },
  //         {
  //           title: "Sheet",
  //           icon: "i-lucide-circle",
  //           link: "/components/sheet",
  //         },
  //         {
  //           title: "Skeleton",
  //           icon: "i-lucide-circle",
  //           link: "/components/skeleton",
  //         },
  //         {
  //           title: "Slider",
  //           icon: "i-lucide-circle",
  //           link: "/components/slider",
  //         },
  //         {
  //           title: "Sonner",
  //           icon: "i-lucide-circle",
  //           link: "/components/sonner",
  //         },
  //         {
  //           title: "Stepper",
  //           icon: "i-lucide-circle",
  //           link: "/components/stepper",
  //           new: true,
  //         },
  //         {
  //           title: "Switch",
  //           icon: "i-lucide-circle",
  //           link: "/components/switch",
  //         },
  //         {
  //           title: "Table",
  //           icon: "i-lucide-circle",
  //           link: "/components/table",
  //         },
  //         {
  //           title: "Tabs",
  //           icon: "i-lucide-circle",
  //           link: "/components/tabs",
  //         },
  //         {
  //           title: "Tags Input",
  //           icon: "i-lucide-circle",
  //           link: "/components/tags-input",
  //         },
  //         {
  //           title: "Textarea",
  //           icon: "i-lucide-circle",
  //           link: "/components/textarea",
  //         },
  //         {
  //           title: "Toast",
  //           icon: "i-lucide-circle",
  //           link: "/components/toast",
  //         },
  //         {
  //           title: "Toggle",
  //           icon: "i-lucide-circle",
  //           link: "/components/toggle",
  //         },
  //         {
  //           title: "Toggle Group",
  //           icon: "i-lucide-circle",
  //           link: "/components/toggle-group",
  //         },
  //         {
  //           title: "Tooltip",
  //           icon: "i-lucide-circle",
  //           link: "/components/tooltip",
  //         },
  //       ],
  //     },
  //   ],
  // },
];

export const navMenuBottom: NavMenuItems = [
  {
    title: "User Management",
    icon: "i-lucide-users",
    link: "/admin/users",
  },
  {
    title: "Chatbot Management",
    icon: "i-lucide-message-circle-question",
    link: "/admin/chatbot",
  },
  {
    title: "Help & Support",
    icon: "i-lucide-circle-help",
    link: "https://github.com/ThaiPhancde",
  },
  {
    title: "Feedback",
    icon: "i-lucide-send",
    link: "https://www.facebook.com/Thai.An.249/",
  },
];
