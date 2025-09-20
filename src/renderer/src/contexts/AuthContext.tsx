import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, setSessionExpiredHandler } from '../services/api';
import { message, Modal } from 'antd';
import i18n from '../i18n';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  handleSessionExpired: () => void;
  loading: boolean; // 初始化loading状态
  loginLoading: boolean; // 登录过程loading状态
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔐 AuthProvider initializing...');

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // 初始化loading
  const [loginLoading, setLoginLoading] = useState(false); // 登录loading

  const handleSessionExpired = () => {
    // 清除认证状态
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 显示会话过期对话框
    Modal.error({
      title: i18n.t('auth.sessionExpiredTitle') || '会话已过期',
      content: i18n.t('auth.sessionExpiredMessage') || '您的登录会话已过期，请重新登录以继续使用。',
      okText: i18n.t('auth.relogin') || '重新登录',
      onOk: () => {
        // 对话框关闭后，用户状态已经被清除，ProtectedRoute会自动重定向到登录页
      },
    });
  };

  useEffect(() => {
    console.log('🔍 AuthProvider useEffect - checking for existing token...');

    try {
      // 每次应用启动时清除登录状态，要求重新登录
      console.log('🧹 Clearing login state on app startup...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 确保状态为空
      setToken(null);
      setUser(null);

      console.log('🔓 AuthProvider initialization complete - login required');
      setLoading(false);

      // 设置全局的会话过期处理器
      setSessionExpiredHandler(handleSessionExpired);
    } catch (error) {
      console.error('❌ Error in AuthProvider useEffect:', error);
      setLoading(false);
    }
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      setLoginLoading(true);
      const response = await authAPI.login(credentials);
      const data = response.data;

      // 检查登录是否成功
      if (data.success === false) {
        // 登录失败，直接显示接口返回的错误信息
        message.error(data.message);
        return false;
      }

      // 登录成功
      const { access_token, user: userData } = data;
      setToken(access_token);
      setUser(userData);

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      message.success(i18n.t('auth.loginSuccess'));
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || i18n.t('auth.loginFailed');
      message.error(errorMessage);
      return false;
    } finally {
      setLoginLoading(false);
    }
  };



  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success(i18n.t('auth.logoutSuccess'));
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    handleSessionExpired,
    loading,
    loginLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
