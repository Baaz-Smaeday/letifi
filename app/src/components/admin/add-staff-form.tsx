'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AddStaffForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  return (
    <div className="space-y-4">
      <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
        <select
          value={role} onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        >
          <option value="viewer">Viewer – Read only</option>
          <option value="editor">Editor – Can edit data</option>
          <option value="admin">Admin – Full access</option>
        </select>
      </div>
      <Button className="w-full">Add Staff Member</Button>
      <p className="text-xs text-slate-400 text-center">Staff member will receive an email invitation</p>
    </div>
  );
}
