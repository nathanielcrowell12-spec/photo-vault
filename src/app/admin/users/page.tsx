'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Shield, 
  Users, 
  Search,
  Edit,
  Ban,
  CheckCircle,
  Crown,
  Camera,
  Heart
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AccessGuard from '@/components/AccessGuard'

interface UserProfile {
  id: string
  email: string
  user_type: 'client' | 'photographer' | 'admin'
  full_name: string | null
  business_name: string | null
  payment_status: string | null
  last_payment_date: string | null
  created_at: string
  updated_at: string
  is_suspended: boolean
  suspension_reason: string | null
}

export default function UserProfilesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loadingUsers) {
        console.log('Fetch users timeout - setting loading to false')
        setLoadingUsers(false)
        setUsers([])
      }
    }, 10000) // 10 second timeout

    fetchUsers()

    return () => clearTimeout(timeoutId)
  }, [loadingUsers])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, filterType, filterStatus])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      console.log('Fetching users from database...')
      
      // Add timeout to the Supabase query
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as { data: UserProfile[] | null; error: unknown }

      if (error) {
        console.error('Database error:', error)
        
        // If database is unavailable, show empty state
        const errorObj = error as { message?: string; code?: string }
        if (errorObj.message === 'Database query timeout' || errorObj.code === 'PGRST301') {
          console.log('Database unavailable, showing empty state')
          setUsers([])
          return
        }
        
        // Set empty array for other errors
        setUsers([])
        return
      }

      console.log('Found user profiles:', data?.length || 0)

      // For now, let's just use the user profiles without trying to get emails from auth
      // This avoids potential admin API issues
      const usersWithEmails = data?.map((userProfile: UserProfile) => ({
        ...userProfile,
        email: `user-${userProfile.id.slice(0, 8)}@example.com`, // Temporary placeholder
        is_suspended: userProfile.payment_status === 'suspended' || false,
        suspension_reason: userProfile.payment_status === 'suspended' ? 'Administrative suspension' : null
      })) || []

      setUsers(usersWithEmails)
      console.log('Users loaded successfully:', usersWithEmails.length)
    } catch (error) {
      console.error('Error fetching users:', error)
      
      // If there's a complete failure, show empty state
      console.log('Complete fetch failure, showing empty state')
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const filterUsers = useCallback(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.user_type === filterType)
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filtered = filtered.filter(user => user.payment_status === 'active')
      } else if (filterStatus === 'suspended') {
        filtered = filtered.filter(user => user.is_suspended)
      } else if (filterStatus === 'pending') {
        filtered = filtered.filter(user => user.payment_status === 'pending')
      }
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, filterType, filterStatus])

  const updateUserType = async (userId: string, newUserType: 'client' | 'photographer' | 'admin') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ user_type: newUserType })
        .eq('id', userId)

      if (error) throw error

      alert(`User type updated to ${newUserType}`)
      fetchUsers()
      setEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating user type:', error)
      alert('Failed to update user type')
    }
  }

  const suspendUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          payment_status: 'suspended',
          suspension_reason: reason
        })
        .eq('id', userId)

      if (error) throw error

      alert('User suspended successfully')
      fetchUsers()
      setSuspendDialogOpen(false)
      setSuspensionReason('')
    } catch (error) {
      console.error('Error suspending user:', error)
      alert('Failed to suspend user')
    }
  }

  const unsuspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          payment_status: 'active',
          suspension_reason: null
        })
        .eq('id', userId)

      if (error) throw error

      alert('User unsuspended successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error unsuspending user:', error)
      alert('Failed to unsuspend user')
    }
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Crown className="h-4 w-4 text-amber-600" />
      case 'photographer':
        return <Camera className="h-4 w-4 text-blue-600" />
      case 'client':
        return <Heart className="h-4 w-4 text-pink-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Badge className="bg-amber-100 text-amber-800">Admin</Badge>
      case 'photographer':
        return <Badge className="bg-blue-100 text-blue-800">Photographer</Badge>
      case 'client':
        return <Badge className="bg-pink-100 text-pink-800">Client</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusBadge = (user: UserProfile) => {
    if (user.is_suspended) {
      return <Badge variant="destructive">Suspended</Badge>
    }
    switch (user.payment_status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold">User Management</h1>
                  <p className="text-sm text-gray-600">Manage user profiles, privileges, and permissions</p>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/admin/dashboard')}
                variant="outline"
              >
                Back to Admin Dashboard
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Admins</p>
                      <p className="text-2xl font-bold">{users.filter(u => u.user_type === 'admin').length}</p>
                    </div>
                    <Crown className="h-8 w-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Photographers</p>
                      <p className="text-2xl font-bold">{users.filter(u => u.user_type === 'photographer').length}</p>
                    </div>
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Suspended</p>
                      <p className="text-2xl font-bold">{users.filter(u => u.is_suspended).length}</p>
                    </div>
                    <Ban className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>User Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Search Users</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by email, name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="type-filter">User Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="photographer">Photographer</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={fetchUsers} className="w-full">
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>User Profiles ({filteredUsers.length})</CardTitle>
                <CardDescription>Manage user privileges and account status</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-600 mb-4">
                      {users.length === 0 
                        ? "No user profiles exist in the database yet."
                        : "No users match your current filters."
                      }
                    </p>
                    <Button onClick={fetchUsers} variant="outline">
                      Refresh Users
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Payment</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((userProfile) => (
                          <TableRow key={userProfile.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{userProfile.email}</div>
                                <div className="text-sm text-gray-600">
                                  {userProfile.full_name || userProfile.business_name || 'No name set'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getUserTypeIcon(userProfile.user_type)}
                                {getUserTypeBadge(userProfile.user_type)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(userProfile)}
                            </TableCell>
                            <TableCell>
                              {new Date(userProfile.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {userProfile.last_payment_date 
                                ? new Date(userProfile.last_payment_date).toLocaleDateString()
                                : 'Never'
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(userProfile)
                                    setEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                
                                {userProfile.is_suspended ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => unsuspendUser(userProfile.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Unsuspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(userProfile)
                                      setSuspendDialogOpen(true)
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Suspend
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>
                Change user type and privileges for {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-type">User Type</Label>
                <Select 
                  value={selectedUser?.user_type} 
                  onValueChange={(value) => {
                    if (selectedUser) {
                      updateUserType(selectedUser.id, value as 'client' | 'photographer' | 'admin')
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">
                      <div className="flex items-center space-x-2">
                        <Heart className="h-4 w-4 text-pink-600" />
                        <span>Client</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="photographer">
                      <div className="flex items-center space-x-2">
                        <Camera className="h-4 w-4 text-blue-600" />
                        <span>Photographer</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-amber-600" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend User Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend User</DialogTitle>
              <DialogDescription>
                Suspend {selectedUser?.email} for policy violations or other reasons
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="suspension-reason">Suspension Reason</Label>
                <Input
                  id="suspension-reason"
                  placeholder="Enter reason for suspension..."
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (selectedUser && suspensionReason) {
                    suspendUser(selectedUser.id, suspensionReason)
                  }
                }}
                disabled={!suspensionReason}
              >
                Suspend User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AccessGuard>
  )
}
