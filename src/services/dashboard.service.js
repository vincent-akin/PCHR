import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Transfer from '../models/Transfer.js';
import File from '../models/File.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Get main dashboard statistics
 */
export const getDashboardStats = async (tenantId) => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Parallel queries for better performance
    const [
        totalPatients,
        newPatientsToday,
        newPatientsThisWeek,
        newPatientsThisMonth,
        totalRecords,
        recordsToday,
        recordsThisWeek,
        recordsThisMonth,
        pendingTransfers,
        transfersToday,
        transfersThisWeek,
        totalFiles,
        totalStorageUsed,
        activeUsers,
        doctors,
        nurses,
        labTechs
    ] = await Promise.all([
    // Patient counts
        Patient.countDocuments({ tenantId, isDeleted: false }),
        Patient.countDocuments({ tenantId, isDeleted: false, createdAt: { $gte: startOfDay } }),
        Patient.countDocuments({ tenantId, isDeleted: false, createdAt: { $gte: startOfWeek } }),
        Patient.countDocuments({ tenantId, isDeleted: false, createdAt: { $gte: startOfMonth } }),
        
        // Record counts
        MedicalRecord.countDocuments({ tenantId, isDeleted: false }),
        MedicalRecord.countDocuments({ tenantId, isDeleted: false, createdAt: { $gte: startOfDay } }),
        MedicalRecord.countDocuments({ tenantId, isDeleted: false, createdAt: { $gte: startOfWeek } }),
        MedicalRecord.countDocuments({ tenantId, isDeleted: false, createdAt: { $gte: startOfMonth } }),
        
        // Transfer counts
        Transfer.countDocuments({ 
            $or: [{ fromTenant: tenantId }, { toTenant: tenantId }],
            status: 'pending',
            isDeleted: false 
        }),
        Transfer.countDocuments({ 
            $or: [{ fromTenant: tenantId }, { toTenant: tenantId }],
            createdAt: { $gte: startOfDay },
            isDeleted: false 
        }),
        Transfer.countDocuments({ 
            $or: [{ fromTenant: tenantId }, { toTenant: tenantId }],
            createdAt: { $gte: startOfWeek },
            isDeleted: false 
        }),
        
        // File stats
        File.countDocuments({ tenantId, isDeleted: false }),
        File.aggregate([
            { $match: { tenantId, isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]),
        
        // User stats
        User.countDocuments({ tenantId, isActive: true }),
        User.countDocuments({ tenantId, role: 'doctor', isActive: true }),
        User.countDocuments({ tenantId, role: 'nurse', isActive: true }),
        User.countDocuments({ tenantId, role: 'lab_technician', isActive: true })
    ]);
    
    const totalStorageMB = totalStorageUsed[0]?.total / (1024 * 1024) || 0;
    
    return {
        patients: {
            total: totalPatients,
            newToday: newPatientsToday,
            newThisWeek: newPatientsThisWeek,
            newThisMonth: newPatientsThisMonth,
            trend: calculateTrend(newPatientsThisMonth, totalPatients)
        },
        records: {
            total: totalRecords,
            newToday: recordsToday,
            newThisWeek: recordsThisWeek,
            newThisMonth: recordsThisMonth,
            trend: calculateTrend(recordsThisMonth, totalRecords)
        },
        transfers: {
            pending: pendingTransfers,
            today: transfersToday,
            thisWeek: transfersThisWeek,
            trend: calculateTransferTrend(transfersThisWeek, transfersToday)
        },
        files: {
            total: totalFiles,
            totalStorageMB: Math.round(totalStorageMB * 10) / 10,
            storageUsedPercent: calculateStoragePercent(totalStorageMB)
        },
        users: {
            total: activeUsers,
            doctors,
            nurses,
            labTechnicians: labTechs,
            distribution: {
                doctors: Math.round((doctors / activeUsers) * 100) || 0,
                nurses: Math.round((nurses / activeUsers) * 100) || 0,
                labTechnicians: Math.round((labTechs / activeUsers) * 100) || 0,
                others: 100 - Math.round(((doctors + nurses + labTechs) / activeUsers) * 100) || 0
            }
        }
    };
};

/**
 * Get patient demographics
 */
export const getPatientDemographics = async (tenantId) => {
    const demographics = await Patient.aggregate([
        { $match: { tenantId, isDeleted: false } },
        {
            $facet: {
                byGender: [
                    { $group: { _id: '$gender', count: { $sum: 1 } } }
                ],
                byBloodGroup: [
                    { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }
                ],
                byAgeGroup: [
                {
                    $project: {
                    ageGroup: {
                        $switch: {
                        branches: [
                            { case: { $lt: ['$dateOfBirth', new Date(new Date().setFullYear(new Date().getFullYear() - 18))] }, then: '0-18' },
                            { case: { $lt: ['$dateOfBirth', new Date(new Date().setFullYear(new Date().getFullYear() - 30))] }, then: '19-30' },
                            { case: { $lt: ['$dateOfBirth', new Date(new Date().setFullYear(new Date().getFullYear() - 50))] }, then: '31-50' },
                            { case: { $lt: ['$dateOfBirth', new Date(new Date().setFullYear(new Date().getFullYear() - 65))] }, then: '51-65' }
                        ],
                        default: '65+'
                        }
                    }
                    }
                },
                    { $group: { _id: '$ageGroup', count: { $sum: 1 } } }
                ],
                byLocation: [
                    { $group: { _id: '$address.city', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]
            }
        }
    ]);
    
    const result = demographics[0];
    
    return {
        gender: result.byGender.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
        bloodGroup: result.byBloodGroup.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
        ageGroup: result.byAgeGroup.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
        topLocations: result.byLocation
    };
};

/**
 * Get record type distribution
 */
export const getRecordDistribution = async (tenantId) => {
    const distribution = await MedicalRecord.aggregate([
        { $match: { tenantId, isDeleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    
    return distribution;
};

/**
 * Get recent activity timeline
 */
export const getRecentActivity = async (tenantId, limit = 10) => {
    const activities = await AuditLog.find({ tenantId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'name email role')
        .lean();
    
    return activities.map(activity => ({
        id: activity._id,
        action: activity.action,
        user: {
            name: activity.userName,
            email: activity.userEmail,
            role: activity.userRole
        },
        resource: {
            type: activity.resourceType,
            id: activity.resourceId,
            name: activity.resourceName
        },
        description: activity.description,
        timestamp: activity.timestamp,
        ipAddress: activity.ipAddress
    }));
};

/**
 * Get top doctors by activity
 */
export const getTopDoctors = async (tenantId, limit = 5) => {
        const topDoctors = await MedicalRecord.aggregate([
            { $match: { tenantId, isDeleted: false } },
            { $group: { _id: '$doctorId', recordCount: { $sum: 1 } } },
            { $sort: { recordCount: -1 } },
            { $limit: limit },
            {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'doctor'
            }
        },
        { $unwind: '$doctor' },
        {
            $project: {
                doctorId: '$_id',
                doctorName: '$doctor.name',
                doctorEmail: '$doctor.email',
                specialization: '$doctor.specialization',
                recordCount: 1
            }
        }
    ]);
    
    return topDoctors;
};

/**
 * Get monthly trends for charts
 */
export const getMonthlyTrends = async (tenantId, months = 6) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const [patients, records, transfers] = await Promise.all([
        Patient.aggregate([
        { $match: { tenantId, isDeleted: false, createdAt: { $gte: startDate } } },
        {
            $group: {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),
        MedicalRecord.aggregate([
        { $match: { tenantId, isDeleted: false, createdAt: { $gte: startDate } } },
        {
            $group: {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),
        Transfer.aggregate([
        { $match: { 
            $or: [{ fromTenant: tenantId }, { toTenant: tenantId }],
            isDeleted: false,
            createdAt: { $gte: startDate }
        }},
        {
            $group: {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
    ]);
    
    return {
        patients: formatMonthlyData(patients, months),
        records: formatMonthlyData(records, months),
        transfers: formatMonthlyData(transfers, months)
    };
};

/**
 * Get storage usage breakdown
 */
export const getStorageBreakdown = async (tenantId) => {
    const breakdown = await File.aggregate([
        { $match: { tenantId, isDeleted: false } },
        {
        $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' }
        }
        },
        { $sort: { totalSize: -1 } }
    ]);
    
    return breakdown.map(item => ({
        category: item._id,
        count: item.count,
        sizeMB: Math.round(item.totalSize / (1024 * 1024) * 10) / 10
    }));
};

/**
 * Get real-time alerts
 */
export const getAlerts = async (tenantId) => {
    const alerts = [];
    
    // Check storage usage
    const storageStats = await File.aggregate([
        { $match: { tenantId, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]);
    
    const totalStorageMB = (storageStats[0]?.total || 0) / (1024 * 1024);
    const tenant = await Tenant.findById(tenantId);
    const storageLimit = tenant?.config.maxStorageGB * 1024 || 0;
    const storagePercent = (totalStorageMB / storageLimit) * 100;
    
    if (storagePercent > 90) {
        alerts.push({
            type: 'critical',
            title: 'Storage Almost Full',
            message: `Storage usage is at ${Math.round(storagePercent)}%. Please consider upgrading your plan.`,
            timestamp: new Date()
        });
    } else if (storagePercent > 75) {
        alerts.push({
            type: 'warning',
            title: 'High Storage Usage',
            message: `Storage usage is at ${Math.round(storagePercent)}%. Consider cleaning up old files.`,
            timestamp: new Date()
        });
    }
    
    // Check pending transfers
    const pendingTransfers = await Transfer.countDocuments({
        $or: [{ fromTenant: tenantId }, { toTenant: tenantId }],
        status: 'pending',
        isDeleted: false
    });
    
    if (pendingTransfers > 10) {
        alerts.push({
            type: 'info',
            title: 'Pending Transfers',
            message: `There are ${pendingTransfers} pending transfer requests waiting for action.`,
            timestamp: new Date()
        });
    }
    
    // Check user limit
    const activeUsers = await User.countDocuments({ tenantId, isActive: true });
    if (activeUsers > (tenant?.config.maxUsers * 0.9)) {
        alerts.push({
            type: 'warning',
            title: 'User Limit Approaching',
            message: `You have ${activeUsers} out of ${tenant?.config.maxUsers} users. Consider adding more seats.`,
            timestamp: new Date()
        });
    }
    
    return alerts;
};

// Helper functions
const calculateTrend = (newCount, total) => {
  if (total === 0) return 0;
  return Math.round((newCount / total) * 100);
};

const calculateTransferTrend = (thisWeek, today) => {
  if (thisWeek === 0) return 0;
  return Math.round((today / thisWeek) * 100);
};

const calculateStoragePercent = (usedMB) => {
  // Assume default 100GB limit, will be replaced with actual tenant limit
  const limitMB = 100 * 1024;
  return Math.round((usedMB / limitMB) * 100);
};

const formatMonthlyData = (data, months) => {
  const result = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const found = data.find(d => d._id.year === year && d._id.month === month);
    result.push({
      month: `${year}-${String(month).padStart(2, '0')}`,
      count: found ? found.count : 0
    });
  }
  
  return result;
};