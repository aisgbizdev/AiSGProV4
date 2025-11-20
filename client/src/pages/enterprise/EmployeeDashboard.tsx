import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Search, Filter, Users, Building2, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string;
  joinDate: string;
  status: string;
  position: {
    id: string;
    code: string;
    name: string;
    level: number;
  } | null;
  branch: {
    id: string;
    code: string;
    name: string;
  } | null;
  pt: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface EmployeeListResponse {
  success: boolean;
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function EmployeeDashboard() {
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('all');
  const [branch, setBranch] = useState('all');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const limit = 50;

  // Fetch branches for filter dropdown
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/branches');
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    },
  });

  // Fetch employees
  const { data, isLoading, error } = useQuery<EmployeeListResponse>({
    queryKey: ['employees', { search, position, branch, status, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        position,
        branch,
        status,
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`/api/enterprise/employees?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch employees');
      }
      return res.json();
    },
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to page 1 when searching
  };

  const handleFilterChange = () => {
    setPage(1); // Reset to page 1 when filtering
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and view employee data across the organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/enterprise/upload">Upload BAS Data</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.pagination.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active employees in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Branches</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Across organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11</div>
            <p className="text-xs text-muted-foreground">
              From BC to Owner
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Branch Filter */}
            <Select value={branch} onValueChange={(v) => { setBranch(v); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Branches</SelectItem>
                {branchesData?.data?.map((b: any) => (
                  <SelectItem key={b.code} value={b.code}>
                    {b.code} - {b.name} ({b.employeeCount || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Position Filter */}
            <Select value={position} onValueChange={(v) => { setPosition(v); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="BC">BC</SelectItem>
                <SelectItem value="SBC">SBC</SelectItem>
                <SelectItem value="BSM">BSM</SelectItem>
                <SelectItem value="SBM">SBM</SelectItem>
                <SelectItem value="EM">EM</SelectItem>
                <SelectItem value="SEM">SEM</SelectItem>
                <SelectItem value="VBM">VBM</SelectItem>
                <SelectItem value="BRM">BrM</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resign">Resign</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading employees...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>Error loading employees</p>
              <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No employees found</p>
              <p className="text-sm mt-2">Try adjusting your filters or upload BAS data</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono text-sm">
                        {employee.employeeCode}
                      </TableCell>
                      <TableCell className="font-medium">
                        {employee.fullName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {employee.position?.code || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {employee.branch?.code || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {employee.email || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            employee.status === 'active'
                              ? 'default'
                              : employee.status === 'resign'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/enterprise/employees/${employee.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} employees
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
