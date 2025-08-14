import suth_logo from './suth.png';
import close_icon from './close_icon.svg';
import menu_icon from './menu_icon.svg';

export const assets = {
    suth_logo,
    close_icon,
    menu_icon,
}

export interface MenuLink {
    name: string;
    path: string;
}

export const menuLinks: MenuLink[] = [
    { name: "หน้าแรก", path: "/" },
    { name: "ตรวจสอบการใช้น้ำ", path: "/water" },
    { name: "ติดต่อและสอบถาม", path: "/contact" },
    { name: "แอดมิน", path: "/admin" },
];

