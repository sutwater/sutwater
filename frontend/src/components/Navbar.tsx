import { assets, menuLinks } from '../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Navbar: React.FC = ({ }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState<boolean>(false); // เพิ่ม useState ที่หายไป
    const { setUser, user } = useAppContext();
    
    const handleLogout = () => {
        localStorage.clear(); // หรือที่คุณใช้จัดเก็บ auth
        setUser(null); // ถ้ามีการจัดการ context
        navigate('/login');
    };
    console.log(user)
    return (
        <div
            className={`flex items-center justify-between px-6 md:px-16 lg:px-24
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
            duration-300 z-50 ${location.pathname === '/' ? 'bg-light' : 'bg-white'} 
            ${open ? 'max-sm:translate-x-0' : 'max-sm:-translate-x-full'}`}
            >
                {menuLinks.map((link: { name: string; path: string }, index: number) => (
                    <Link key={index} to={link.path}>
                        {link.name}
                    </Link>
                ))}

                
                {(
                    <span className="text-sm text-gray-700">
                        Welcome, <strong>{user?.first_name}</strong>
                    </span>
                )}
                {user && (
                    <button
                        onClick={handleLogout}
                        className="text-red-500 hover:underline"
                    >
                        ออกจากระบบ
                    </button>
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
