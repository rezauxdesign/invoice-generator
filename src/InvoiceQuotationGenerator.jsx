import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';

export default function InvoiceQuotationGenerator() {
  // State management
  const [docType, setDocType] = useState('quotation'); // 'quotation' or 'invoice'
  const [mode, setMode] = useState('simple'); // 'simple', 'hourly', 'items', 'phases'
  const [currentTab, setCurrentTab] = useState('new'); // 'new', 'clients', 'history'
  
  // Client management
  const [clients, setClients] = useState(() => {
    const stored = localStorage.getItem('clients');
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Document counters
  const [quoteCount, setQuoteCount] = useState(() => {
    const stored = localStorage.getItem('quoteCount');
    return stored ? parseInt(stored) : 0;
  });
  const [invoiceCount, setInvoiceCount] = useState(() => {
    const stored = localStorage.getItem('invoiceCount');
    return stored ? parseInt(stored) : 0;
  });

  // Form data
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectName: '',
    description: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    // Simple mode
    totalAmount: '',
    paymentTerms: '',
    // Hourly mode
    hourlyRate: '',
    hoursWorked: '',
    expenses: '',
    // Line items
    lineItems: [{ description: '', amount: '' }],
    // Phases
    phases: [{ name: '', deliverables: '', amount: '' }],
  });

  // History
  const [history, setHistory] = useState(() => {
    const stored = localStorage.getItem('documents');
    return stored ? JSON.parse(stored) : [];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('quoteCount', quoteCount.toString());
  }, [quoteCount]);

  useEffect(() => {
    localStorage.setItem('invoiceCount', invoiceCount.toString());
  }, [invoiceCount]);

  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(history));
  }, [history]);

  // Generate quote/invoice number
  const getNextNumber = () => {
    if (docType === 'quotation') {
      const newCount = quoteCount + 1;
      setQuoteCount(newCount);
      return `Q-${String(newCount).padStart(3, '0')}`;
    } else {
      const newCount = invoiceCount + 1;
      setInvoiceCount(newCount);
      return `INV-${String(newCount).padStart(3, '0')}`;
    }
  };

  // Add client
  const addClient = () => {
    if (newClientName && newClientEmail) {
      const newClient = {
        id: Date.now(),
        name: newClientName,
        email: newClientEmail,
        phone: newClientPhone,
      };
      setClients([...clients, newClient]);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
    }
  };

  // Select client
  const selectClientForForm = (client) => {
    setFormData({
      ...formData,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
    });
    setSelectedClient(client);
  };

  // Handle form input
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add line item
  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', amount: '' }],
    });
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.lineItems];
    newItems[index][field] = value;
    setFormData({ ...formData, lineItems: newItems });
  };

  const removeLineItem = (index) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  // Add phase
  const addPhase = () => {
    setFormData({
      ...formData,
      phases: [...formData.phases, { name: '', deliverables: '', amount: '' }],
    });
  };

  const updatePhase = (index, field, value) => {
    const newPhases = [...formData.phases];
    newPhases[index][field] = value;
    setFormData({ ...formData, phases: newPhases });
  };

  const removePhase = (index) => {
    setFormData({
      ...formData,
      phases: formData.phases.filter((_, i) => i !== index),
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    if (mode === 'simple') {
      subtotal = parseFloat(formData.totalAmount) || 0;
    } else if (mode === 'hourly') {
      const hourly = (parseFloat(formData.hourlyRate) || 0) * (parseFloat(formData.hoursWorked) || 0);
      const exp = parseFloat(formData.expenses) || 0;
      subtotal = hourly + exp;
    } else if (mode === 'items') {
      subtotal = formData.lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    } else if (mode === 'phases') {
      subtotal = formData.phases.reduce((sum, phase) => sum + (parseFloat(phase.amount) || 0), 0);
    }
    return { subtotal, tax: 0, total: subtotal };
  };

  // FIXED: Generate PDF using direct text approach
  const generatePDF = async () => {
    try {
      const docNumber = getNextNumber();
      const totals = calculateTotals();

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header (dark background simulation with text)
      pdf.setFillColor(26, 26, 26);
      pdf.rect(0, 0, pageWidth, 50, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('Reza', 20, 25);
      
      pdf.setFontSize(10);
      pdf.text('Designer', 20, 32);

      pdf.setFontSize(14);
      pdf.text(docType === 'quotation' ? 'QUOTATION' : 'INVOICE', pageWidth - 40, 25);
      
      pdf.setFontSize(10);
      pdf.text(docNumber, pageWidth - 40, 35);

      pdf.setFontSize(9);
      pdf.text('Email: reza.uxdesign@gmail.com', 20, 42);

      yPosition = 60;

      // Body content
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);

      // Bill To
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text('BILL TO', 20, yPosition);
      
      yPosition += 6;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.text(formData.clientName || 'Client Name', 20, yPosition);
      
      yPosition += 6;
      pdf.setFontSize(9);
      pdf.text(formData.clientEmail || 'email@example.com', 20, yPosition);
      
      if (formData.clientPhone) {
        yPosition += 6;
        pdf.text(formData.clientPhone, 20, yPosition);
      }

      yPosition += 10;

      // Project
      pdf.setFontSize(12);
      pdf.text(formData.projectName || 'Project Name', 20, yPosition);
      
      if (formData.description) {
        yPosition += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const descLines = pdf.splitTextToSize(formData.description, 170);
        pdf.text(descLines, 20, yPosition);
        yPosition += descLines.length * 4;
      }

      yPosition += 8;

      // Dates
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.text('Issue Date: ' + formData.issueDate, 20, yPosition);
      
      if (docType === 'invoice' && formData.dueDate) {
        pdf.text('Due Date: ' + formData.dueDate, 120, yPosition);
      }

      yPosition += 12;

      // Items table
      const tableStartY = yPosition;
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(232, 232, 232);
      pdf.rect(20, tableStartY, 170, 8, 'F');

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text('Description', 25, tableStartY + 6);
      pdf.text('Amount', 160, tableStartY + 6);

      yPosition = tableStartY + 12;
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);

      if (mode === 'simple') {
        pdf.text(formData.projectName || 'Project', 25, yPosition);
        pdf.text('$' + parseFloat(formData.totalAmount).toFixed(2), 160, yPosition);
        yPosition += 8;
      } else if (mode === 'hourly') {
        const hourlyAmount = (parseFloat(formData.hourlyRate) || 0) * (parseFloat(formData.hoursWorked) || 0);
        pdf.text(`Hourly (${formData.hoursWorked}h @ $${formData.hourlyRate}/hr)`, 25, yPosition);
        pdf.text('$' + hourlyAmount.toFixed(2), 160, yPosition);
        yPosition += 8;
        
        if (parseFloat(formData.expenses) > 0) {
          pdf.text('Expenses', 25, yPosition);
          pdf.text('$' + parseFloat(formData.expenses).toFixed(2), 160, yPosition);
          yPosition += 8;
        }
      } else if (mode === 'items') {
        formData.lineItems.forEach((item) => {
          if (item.description && item.amount) {
            pdf.text(item.description, 25, yPosition);
            pdf.text('$' + parseFloat(item.amount).toFixed(2), 160, yPosition);
            yPosition += 8;
          }
        });
      } else if (mode === 'phases') {
        formData.phases.forEach((phase) => {
          if (phase.name && phase.amount) {
            pdf.text(phase.name, 25, yPosition);
            pdf.text('$' + parseFloat(phase.amount).toFixed(2), 160, yPosition);
            yPosition += 6;
            
            if (phase.deliverables) {
              const delLines = pdf.splitTextToSize(phase.deliverables, 130);
              pdf.setFontSize(8);
              pdf.setTextColor(100, 100, 100);
              pdf.text(delLines, 25, yPosition);
              yPosition += delLines.length * 3 + 2;
              pdf.setFontSize(9);
              pdf.setTextColor(0, 0, 0);
            }
          }
        });
      }

      yPosition += 6;

      // Totals
      pdf.setDrawColor(200, 200, 200);
      pdf.line(120, yPosition, 190, yPosition);
      
      yPosition += 6;
      pdf.setFont(undefined, 'normal');
      pdf.text('Subtotal:', 120, yPosition);
      pdf.text('$' + totals.subtotal.toFixed(2), 160, yPosition);
      
      yPosition += 8;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.text('TOTAL:', 120, yPosition);
      pdf.text('$' + totals.total.toFixed(2), 160, yPosition);

      yPosition += 15;

      // Payment terms
      if (formData.paymentTerms) {
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text('Payment Terms:', 20, yPosition);
        yPosition += 5;
        pdf.setTextColor(0, 0, 0);
        const termLines = pdf.splitTextToSize(formData.paymentTerms, 170);
        pdf.text(termLines, 20, yPosition);
        yPosition += termLines.length * 4;
      }

      // Footer
      pdf.setFillColor(26, 26, 26);
      pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      
      pdf.setTextColor(170, 170, 170);
      pdf.setFontSize(9);
      if (docType === 'quotation') {
        pdf.text('Valid for 30 days from issue date.', 20, pageHeight - 12);
      } else {
        pdf.text('Payment via Bank Transfer: BCA 3420429192 - Muhamad Reza', 20, pageHeight - 12);
      }

      // Save PDF
      pdf.save(`${docNumber}.pdf`);

      // Add to history
      const newDoc = {
        id: Date.now(),
        docType,
        docNumber,
        clientName: formData.clientName,
        projectName: formData.projectName,
        amount: totals.total,
        dateCreated: new Date().toLocaleDateString(),
      };
      setHistory([...history, newDoc]);

      alert(`${docType === 'quotation' ? 'Quotation' : 'Invoice'} ${docNumber} generated successfully!`);
      resetForm();
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      projectName: '',
      description: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      totalAmount: '',
      paymentTerms: '',
      hourlyRate: '',
      hoursWorked: '',
      expenses: '',
      lineItems: [{ description: '', amount: '' }],
      phases: [{ name: '', deliverables: '', amount: '' }],
    });
    setSelectedClient(null);
  };

  const deleteClient = (id) => {
    setClients(clients.filter(c => c.id !== id));
  };

  const deleteHistory = (id) => {
    setHistory(history.filter(d => d.id !== id));
  };

  const totals = calculateTotals();

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #e0e0e0', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#1a1a1a' }}>Invoice & Quotation Generator</h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Manage clients, generate professional documents, and export PDFs</p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
        <button
          onClick={() => { setCurrentTab('new'); resetForm(); }}
          style={{
            padding: '10px 16px',
            border: currentTab === 'new' ? '2px solid #333' : '1px solid #ccc',
            background: currentTab === 'new' ? '#f5f5f5' : 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: currentTab === 'new' ? 'bold' : 'normal',
            fontSize: '14px',
          }}
        >
          Create New
        </button>
        <button
          onClick={() => setCurrentTab('clients')}
          style={{
            padding: '10px 16px',
            border: currentTab === 'clients' ? '2px solid #333' : '1px solid #ccc',
            background: currentTab === 'clients' ? '#f5f5f5' : 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: currentTab === 'clients' ? 'bold' : 'normal',
            fontSize: '14px',
          }}
        >
          Manage Clients
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          style={{
            padding: '10px 16px',
            border: currentTab === 'history' ? '2px solid #333' : '1px solid #ccc',
            background: currentTab === 'history' ? '#f5f5f5' : 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: currentTab === 'history' ? 'bold' : 'normal',
            fontSize: '14px',
          }}
        >
          History
        </button>
      </div>

      {/* Tab: Create New */}
      {currentTab === 'new' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Form Section */}
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#1a1a1a' }}>Create {docType === 'quotation' ? 'Quotation' : 'Invoice'}</h2>

            {/* Document Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Document Type</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setDocType('quotation')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: docType === 'quotation' ? '2px solid #0066cc' : '1px solid #ccc',
                    background: docType === 'quotation' ? '#e6f0ff' : 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    color: docType === 'quotation' ? '#0066cc' : '#333',
                  }}
                >
                  Quotation
                </button>
                <button
                  onClick={() => setDocType('invoice')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: docType === 'invoice' ? '2px solid #cc0000' : '1px solid #ccc',
                    background: docType === 'invoice' ? '#ffe6e6' : 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    color: docType === 'invoice' ? '#cc0000' : '#333',
                  }}
                >
                  Invoice
                </button>
              </div>
            </div>

            {/* Client Selection */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '13px' }}>Quick Client Selection</label>
              {clients.length === 0 ? (
                <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>No clients yet. Add one in the "Manage Clients" tab.</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => selectClientForForm(client)}
                      style={{
                        padding: '10px',
                        border: selectedClient?.id === client.id ? '2px solid #333' : '1px solid #ddd',
                        background: selectedClient?.id === client.id ? '#f0f0f0' : 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '13px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#1a1a1a' }}>{client.name}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{client.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Client Info Manual Entry */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Client Name</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleFormChange}
                placeholder="Acme Corp"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
              />
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Email</label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleFormChange}
                placeholder="contact@acme.com"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
              />
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Phone (optional)</label>
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleFormChange}
                placeholder="+62 812-3456-7890"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
              />
            </div>

            {/* Project Info */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Project Name</label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleFormChange}
                placeholder="Website Redesign"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
              />
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Description (optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Project scope and details..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  marginBottom: '12px',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                }}
              />
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Issue Date</label>
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleFormChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
              />
              {docType === 'invoice' && (
                <>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleFormChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
                  />
                </>
              )}
            </div>

            {/* Pricing Mode Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Pricing Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['simple', 'hourly', 'items', 'phases'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      padding: '10px',
                      border: mode === m ? '2px solid #333' : '1px solid #ccc',
                      background: mode === m ? '#f0f0f0' : 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: mode === m ? 'bold' : 'normal',
                      fontSize: '12px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {m === 'simple' ? 'Simple' : m === 'hourly' ? 'Hourly' : m === 'items' ? 'Line Items' : 'Phases'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Input Based on Mode */}
            {mode === 'simple' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Total Amount ($)</label>
                <input
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleFormChange}
                  placeholder="5000"
                  step="0.01"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
                />
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Payment Terms</label>
                <input
                  type="text"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleFormChange}
                  placeholder="50% upfront, 50% on completion"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
                />
              </div>
            )}

            {mode === 'hourly' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Hourly Rate ($)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleFormChange}
                  placeholder="75"
                  step="0.01"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
                />
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Hours Worked</label>
                <input
                  type="number"
                  name="hoursWorked"
                  value={formData.hoursWorked}
                  onChange={handleFormChange}
                  placeholder="40"
                  step="0.5"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
                />
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Expenses ($)</label>
                <input
                  type="number"
                  name="expenses"
                  value={formData.expenses}
                  onChange={handleFormChange}
                  placeholder="0"
                  step="0.01"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px' }}
                />
              </div>
            )}

            {mode === 'items' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '13px' }}>Line Items</label>
                {formData.lineItems.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 40px', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                      placeholder="Amount"
                      step="0.01"
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                    <button
                      onClick={() => removeLineItem(index)}
                      style={{
                        padding: '6px',
                        border: '1px solid #ccc',
                        background: '#fff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addLineItem}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #0066cc',
                    background: '#e6f0ff',
                    color: '#0066cc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px',
                  }}
                >
                  + Add Line Item
                </button>
              </div>
            )}

            {mode === 'phases' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '13px' }}>Project Phases</label>
                {formData.phases.map((phase, index) => (
                  <div key={index} style={{ marginBottom: '15px', padding: '12px', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(index, 'name', e.target.value)}
                        placeholder="Phase name (e.g., Design)"
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={() => removePhase(index)}
                        style={{
                          padding: '6px',
                          border: '1px solid #ccc',
                          background: '#fff',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <textarea
                      value={phase.deliverables}
                      onChange={(e) => updatePhase(index, 'deliverables', e.target.value)}
                      placeholder="Deliverables (optional)"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        minHeight: '60px',
                        marginBottom: '8px',
                        fontFamily: 'inherit',
                        fontSize: '12px',
                      }}
                    />
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>Amount ($)</label>
                    <input
                      type="number"
                      value={phase.amount}
                      onChange={(e) => updatePhase(index, 'amount', e.target.value)}
                      placeholder="0"
                      step="0.01"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <button
                  onClick={addPhase}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #0066cc',
                    background: '#e6f0ff',
                    color: '#0066cc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px',
                  }}
                >
                  + Add Phase
                </button>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#1a1a1a' }}>Summary & Export</h2>
            <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Document Info</h3>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px 0', color: '#666' }}>Type</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{docType === 'quotation' ? 'Quotation' : 'Invoice'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px 0', color: '#666' }}>Client</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{formData.clientName || 'Not specified'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px 0', color: '#666' }}>Project</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{formData.projectName || 'Not specified'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px 0', color: '#666' }}>Subtotal</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>${totals.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#666', fontWeight: 'bold' }}>Total</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#1a1a1a' }}>${totals.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Validation */}
              <div style={{ marginTop: '20px', fontSize: '12px' }}>
                {!formData.clientName && <p style={{ margin: '8px 0', color: '#cc0000' }}>⚠ Client name required</p>}
                {!formData.projectName && <p style={{ margin: '8px 0', color: '#cc0000' }}>⚠ Project name required</p>}
                {totals.total === 0 && <p style={{ margin: '8px 0', color: '#cc0000' }}>⚠ Total amount is $0</p>}
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={generatePDF}
              disabled={!formData.clientName || !formData.projectName || totals.total === 0}
              style={{
                width: '100%',
                padding: '14px',
                background: '#1a1a1a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !formData.clientName || !formData.projectName || totals.total === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                opacity: !formData.clientName || !formData.projectName || totals.total === 0 ? 0.5 : 1,
                marginBottom: '12px',
              }}
            >
              Download PDF
            </button>

            <button
              onClick={resetForm}
              style={{
                width: '100%',
                padding: '10px',
                background: 'white',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              Reset Form
            </button>
          </div>
        </div>
      )}

      {/* Tab: Manage Clients */}
      {currentTab === 'clients' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Add Client */}
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#1a1a1a' }}>Add New Client</h2>
            <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Client Name"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px', fontSize: '13px' }}
              />
              <input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="Email"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px', fontSize: '13px' }}
              />
              <input
                type="tel"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Phone (optional)"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '12px', fontSize: '13px' }}
              />
              <button
                onClick={addClient}
                disabled={!newClientName || !newClientEmail}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !newClientName || !newClientEmail ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  opacity: !newClientName || !newClientEmail ? 0.5 : 1,
                }}
              >
                Add Client
              </button>
            </div>
          </div>

          {/* Client List */}
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#1a1a1a' }}>Your Clients ({clients.length})</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {clients.length === 0 ? (
                <p style={{ padding: '20px', background: '#f9f9f9', borderRadius: '4px', color: '#999', textAlign: 'center', fontSize: '13px' }}>No clients yet.</p>
              ) : (
                clients.map(client => (
                  <div
                    key={client.id}
                    style={{
                      padding: '15px',
                      background: 'white',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      display: 'grid',
                      gridTemplateColumns: '1fr 40px',
                      gap: '12px',
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '13px', color: '#1a1a1a' }}>{client.name}</p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#666' }}>{client.email}</p>
                      {client.phone && <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{client.phone}</p>}
                    </div>
                    <button
                      onClick={() => deleteClient(client.id)}
                      style={{
                        padding: '6px 10px',
                        background: '#ffe6e6',
                        color: '#cc0000',
                        border: '1px solid #cc0000',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {currentTab === 'history' && (
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#1a1a1a' }}>Document History ({history.length})</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {history.length === 0 ? (
              <p style={{ padding: '20px', background: '#f9f9f9', borderRadius: '4px', color: '#999', textAlign: 'center', fontSize: '13px' }}>No documents generated yet.</p>
            ) : (
              history.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    padding: '15px',
                    background: 'white',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '20px',
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          background: doc.docType === 'quotation' ? '#e6f0ff' : '#ffe6e6',
                          color: doc.docType === 'quotation' ? '#0066cc' : '#cc0000',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                        }}
                      >
                        {doc.docType}
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1a1a1a' }}>{doc.docNumber}</span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#1a1a1a' }}>{doc.clientName} • {doc.projectName}</p>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>${doc.amount.toFixed(2)} • {doc.dateCreated}</p>
                  </div>
                  <button
                    onClick={() => deleteHistory(doc.id)}
                    style={{
                      padding: '6px 10px',
                      background: '#f0f0f0',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e0e0e0', color: '#999', fontSize: '12px', textAlign: 'center' }}>
        <p>All data is saved locally in your browser. No accounts or cloud storage required.</p>
      </div>
    </div>
  );
}