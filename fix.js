const fs = require('fs');
let data = fs.readFileSync('frontend/src/components/seller/SellerShell.jsx', 'utf8');

// Replace lucide-react imports
data = data.replace('  Plus,\r\n} from "lucide-react";', '  Plus,\r\n  Truck,\r\n} from "lucide-react";');
data = data.replace('  Plus,\n} from "lucide-react";', '  Plus,\n  Truck,\n} from "lucide-react";');

// Add to SELLER_NAV_ITEMS
data = data.replace('{ id: "shop", label: "Hồ sơ Cửa hàng", icon: Store },', '{ id: "shop", label: "Hồ sơ Cửa hàng", icon: Store },\n  { id: "shipping", label: "Vận chuyển", icon: Truck },');

fs.writeFileSync('frontend/src/components/seller/SellerShell.jsx', data);
