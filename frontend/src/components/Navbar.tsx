import { assets, menuLinks } from '../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ChevronDown, User, Settings, LogOut, Edit } from 'lucide-react';

// User Profile Dropdown Component
const UserProfileDropdown = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        onLogout();
        setIsOpen(false);
    };

    const handleEditProfile = () => {
        console.log('แก้ไขข้อมูลส่วนตัว');
        // ใส่โค้ดแก้ไขข้อมูลที่นี่
        setIsOpen(false);
    };

    const handleSettings = () => {
        console.log('การตั้งค่า');
        // ใส่โค้ดการตั้งค่าที่นี่
        setIsOpen(false);
    };

    return (
        <div className="relative z-1000 inline-block text-left" ref={dropdownRef}>
            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
                {/* Avatar */}
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                        user?.first_name?.charAt(0).toUpperCase() || 'U'
                    )}
                </div>
                
                {/* Welcome Text - ซ่อนในหน้าจอเล็ก */}
                <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs text-gray-600 leading-tight">ยินดีต้อนรับ</span>
                    <span className="text-sm font-semibold text-gray-900 leading-tight">
                        {user?.first_name} {user?.last_name}
                    </span>
                </div>
                
                {/* Arrow */}
                <ChevronDown 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`} 
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    user?.first_name?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <button
                            onClick={handleEditProfile}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        >
                            <Edit className="w-4 h-4" />
                            แก้ไขข้อมูลส่วนตัว
                        </button>
                        
                        {/* <button
                            onClick={handleSettings}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        >
                            <Settings className="w-4 h-4" />
                            การตั้งค่า
                        </button> */}
                        
                        <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                                <LogOut className="w-4 h-4" />
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Navbar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState<boolean>(false);
    const { setUser, user } = useAppContext();
    
    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        navigate('/login');
    };

    console.log(user);

    return (
        <div
            className={`flex items-center z-50 justify-between px-6 md:px-16 lg:px-24
        xl:px-32 py-4 text-gray-600 border-b border-borderColor relative transition-all
        ${location.pathname === '/' && 'bg-light'}`}
        >
            <Link to='/'>
                <img src={assets.suth_logo} alt="logo" className="logo" />
            </Link>

            <div
                className={`max-sm:fixed max-sm:h-screen max-sm:w-full max-sm:top-16 
            max-sm:border-t border-borderColor right-0 flex flex-col sm:flex-row 
            items-start sm:items-center gap-4 sm:gap-8 max-sm:p-4 transition-all 
            duration-300 z-40 ${location.pathname === '/' ? 'bg-light' : 'bg-white'} 
            ${open ? 'max-sm:translate-x-0' : 'max-sm:-translate-x-full'}`}
            >
                {menuLinks.map((link: { name: string; path: string }, index: number) => (
                    <Link key={index} to={link.path} onClick={() => setOpen(false)}>
                        {link.name}
                    </Link>
                ))}

                {/* แทนที่ส่วนเดิมด้วย UserProfileDropdown */}
                {user ? (
                    <UserProfileDropdown user={user} onLogout={handleLogout} />
                ) : (
                    <Link to="/login" className="text-blue-600 hover:underline">
                        เข้าสู่ระบบ
                    </Link>
                )}
            </div>

            <button
                className='sm:hidden cursor-pointer'
                aria-label='Menu'
                onClick={() => setOpen(!open)}
            >
                <img src={open ? assets.close_icon : assets.menu_icon} alt='menu' />
            </button>
        </div>
    );
};

export default Navbar;