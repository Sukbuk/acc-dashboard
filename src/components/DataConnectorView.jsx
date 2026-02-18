import React, { useState, useEffect } from 'react';
import { Database, FileSpreadsheet, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { apsService } from '../services/aps';

function DataConnectorView() {
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [dataListing, setDataListing] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState(null);
  const [useJobsList, setUseJobsList] = useState(false);

  const loadRequests = async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await apsService.getDataConnectorRequests();
      setRequests(Array.isArray(list) ? list : []);
      setSelectedRequestId(null);
      setJobs([]);
      setDataListing([]);
      setSelectedJobId(null);
      setSelectedFile(null);
      setTableData(null);
    } catch (err) {
      setError(err?.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const loadJobs = async () => {
    if (!selectedRequestId) {
      setJobs([]);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const list = await apsService.getDataConnectorJobs(selectedRequestId);
      setJobs(Array.isArray(list) ? list : []);
      setSelectedJobId(null);
      setDataListing([]);
      setSelectedFile(null);
      setTableData(null);
    } catch (err) {
      setError(err?.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) loadJobs();
    else setJobs([]);
  }, [selectedRequestId]);

  const loadJobsList = async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await apsService.getDataConnectorJobsList();
      setJobs(Array.isArray(list) ? list : []);
      setSelectedJobId(null);
      setDataListing([]);
      setSelectedFile(null);
      setTableData(null);
    } catch (err) {
      setError(err?.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDataListing = async () => {
    if (!selectedJobId) {
      setDataListing([]);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const list = await apsService.getDataConnectorDataListing(selectedJobId);
      const items = Array.isArray(list) ? list : (list?.data ?? list?.items ?? []);
      setDataListing(Array.isArray(items) ? items : []);
      setSelectedFile(null);
      setTableData(null);
    } catch (err) {
      setError(err?.message || 'Failed to load data listing');
      setDataListing([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) loadDataListing();
    else setDataListing([]);
  }, [selectedJobId]);

  const loadFile = async (jobId, name) => {
    setError(null);
    setLoadingTable(true);
    setSelectedFile(name);
    try {
      const data = await apsService.getDataConnectorFile(jobId, name);
      setTableData(data);
    } catch (err) {
      setError(err?.message || 'Failed to load file');
      setTableData(null);
    } finally {
      setLoadingTable(false);
    }
  };

  const requestLabel = (r) => {
    const id = r?.id ?? r?.requestId ?? r?.request_id;
    const desc = r?.description ?? r?.name ?? '';
    return desc ? `${desc}` : (id || 'Request');
  };

  const jobLabel = (j) => {
    const id = j?.id ?? j?.jobId ?? j?.job_id;
    const status = j?.status ?? j?.state ?? '';
    return status ? `Job ${id || ''} (${status})` : (id || 'Job');
  };

  const fileDisplayName = (item) => {
    if (typeof item === 'string') return item;
    return item?.name ?? item?.fileName ?? item?.key ?? JSON.stringify(item);
  };

  return (
    <div className="data-connector-view">
      <div className="dc-header">
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={20} /> ACC Data Connector
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Fetch and view extracted CSV data from Data Connector jobs
          </span>
        </div>
        <button
          type="button"
          onClick={() => (useJobsList ? loadJobsList() : loadRequests())}
          disabled={loading}
          className="dc-btn dc-btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="dc-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="dc-layout">
        <div className="dc-sidebar">
          <div className="dc-section">
            <label className="dc-label">
              <input
                type="checkbox"
                checked={useJobsList}
                onChange={(e) => {
                  setUseJobsList(e.target.checked);
                  if (e.target.checked) loadJobsList();
                  else if (selectedRequestId) loadJobs();
                  else setJobs([]);
                }}
              />
              Show all jobs (skip requests)
            </label>
          </div>
          {!useJobsList && (
            <div className="dc-section">
              <div className="dc-label">Request</div>
              {loading && !jobs.length ? (
                <div className="dc-muted">Loading...</div>
              ) : (
                <select
                  className="dc-select"
                  value={selectedRequestId ?? ''}
                  onChange={(e) => setSelectedRequestId(e.target.value || null)}
                >
                  <option value="">Select request</option>
                  {requests.map((r) => {
                    const id = r?.id ?? r?.requestId ?? r?.request_id;
                    return (
                      <option key={id} value={id}>
                        {requestLabel(r)}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}
          <div className="dc-section">
            <div className="dc-label">Job</div>
            {loading && !dataListing.length ? (
              <div className="dc-muted">Loading...</div>
            ) : (
              <select
                className="dc-select"
                value={selectedJobId ?? ''}
                onChange={(e) => setSelectedJobId(e.target.value || null)}
              >
                <option value="">Select job</option>
                {jobs.map((j) => {
                  const id = j?.id ?? j?.jobId ?? j?.job_id;
                  return (
                    <option key={id} value={id}>
                      {jobLabel(j)}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
          <div className="dc-section">
            <div className="dc-label">Data files</div>
            {loading && !tableData ? (
              <div className="dc-muted">Loading...</div>
            ) : (
              <div className="dc-file-list">
                {dataListing.length === 0 && selectedJobId && !loading && (
                  <div className="dc-muted">No data files or still processing</div>
                )}
                {dataListing.map((item, idx) => {
                  const name = fileDisplayName(item);
                  const isCsv = /\.csv$/i.test(name);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`dc-file-item ${selectedFile === name ? 'active' : ''}`}
                      onClick={() => loadFile(selectedJobId, name)}
                    >
                      <FileSpreadsheet size={14} />
                      <span className="dc-file-name">{name}</span>
                      <ChevronRight size={14} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="dc-main">
          {loadingTable && (
            <div className="dc-loading-table">
              <div className="spinner" /> Loading table...
            </div>
          )}
          {!loadingTable && tableData && (
            <div className="dc-table-wrap">
              <div className="dc-table-header">
                <h3>{tableData.name ?? 'Data'}</h3>
                <span className="dc-muted">
                  {tableData.rows?.length ?? 0} rows · {tableData.columns?.length ?? 0} columns
                </span>
              </div>
              <div className="dc-table-scroll">
                <table className="dc-table">
                  <thead>
                    <tr>
                      {(tableData.columns || []).map((col, i) => (
                        <th key={i}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(tableData.rows || []).map((row, ri) => (
                      <tr key={ri}>
                        {(tableData.columns || []).map((col, ci) => (
                          <td key={ci}>{row[col] != null ? String(row[col]) : ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!loadingTable && !tableData && selectedJobId && dataListing.length > 0 && (
            <div className="dc-placeholder">Select a data file to view its contents</div>
          )}
          {!loadingTable && !tableData && (!selectedJobId || !dataListing.length) && (
            <div className="dc-placeholder">Select a request, then a job, then a file</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataConnectorView;
