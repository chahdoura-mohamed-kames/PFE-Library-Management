import { Sidebar } from 'flowbite-react';
import {
  HiArrowSmRight, HiChartPie, HiInbox, HiShoppingBag, HiSupport,
  HiTable, HiUser, HiViewBoards, HiOutlineCloudUpload, HiOutlineFolderAdd
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MobileDashboard from './MobileDashboard';

const SideBar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const avatarUrl = user?.avatar_url
    ? `http://localhost:5000${user.avatar_url}`
    : 'https://ui-avatars.com/api/?name=User';

  return (
    <div>
      <Sidebar aria-label="Sidebar with content separator example" className='hidden md:block'>
        <Sidebar.Logo
          href="/"
          img={avatarUrl}
          className='w-10 h-10 rounded-full'
          imgAlt="User profile"
        >
          <p>{user?.name || "Demo User"}</p>
        </Sidebar.Logo>
        <Sidebar.Items>
          <Sidebar.ItemGroup>
            <Sidebar.Item href="/admin/dashboard" icon={HiChartPie}>
              Dashboard
            </Sidebar.Item>
            <Sidebar.Item href="/admin/dashboard/manage-tasks" icon={HiViewBoards}>
              Manage Tasks
            </Sidebar.Item>

            <Sidebar.Item href="/admin/dashboard/upload" icon={HiOutlineCloudUpload}>
              Upload Book
            </Sidebar.Item>
            <Sidebar.Item href="/admin/dashboard/manage" icon={HiInbox}>
              Manage Books
            </Sidebar.Item>
            <Sidebar.Item href="/admin/dashboard/manage-users" icon={HiUser}>
              Users
            </Sidebar.Item>
            <Sidebar.Item href="#" icon={HiShoppingBag}>
              Products
            </Sidebar.Item>
            <Sidebar.Item href="/login" icon={HiArrowSmRight}>
              Sign In
            </Sidebar.Item>
            <Sidebar.Item href="/logout" icon={HiTable}>
              Log Out
            </Sidebar.Item>
          </Sidebar.ItemGroup>
          <Sidebar.ItemGroup>
            <Sidebar.Item href="#" icon={HiChartPie}>
              Upgrade to Pro
            </Sidebar.Item>
            <Sidebar.Item href="#" icon={HiViewBoards}>
              Documentation
            </Sidebar.Item>
            <Sidebar.Item href="#" icon={HiSupport}>
              Help
            </Sidebar.Item>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>

      <div className='md:hidden'>
        <MobileDashboard />
      </div>
    </div>
  );
};

export default SideBar;
