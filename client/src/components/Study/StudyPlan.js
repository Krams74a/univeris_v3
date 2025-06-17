import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { useTheme } from '../ThemeProvider';
import { studyApi } from '../../api/studyApi';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const StudyPlan = () => {
    const [studyPlan, setStudyPlan] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isDark } = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const planData = await studyApi.getStudyPlan();
                setStudyPlan(planData);

                if (planData.currentTerm) {
                    const subjectsData = await studyApi.getSubjects(planData.currentTerm);
                    // Фильтруем предметы только текущего семестра и с преподавателями
                    const filteredSubjects = subjectsData
                        .filter(
                            subject => subject.termNumber === planData.currentTerm && 
                                     subject.instructors && 
                                     subject.instructors.length > 0
                        )
                        // Сортируем предметы: сначала экзамены, затем остальные
                        .sort((a, b) => {
                            if (a.controlType.toLowerCase() === 'экзамен' && b.controlType.toLowerCase() !== 'экзамен') {
                                return -1;
                            }
                            if (a.controlType.toLowerCase() !== 'экзамен' && b.controlType.toLowerCase() === 'экзамен') {
                                return 1;
                            }
                            return 0;
                        });
                    setSubjects(filteredSubjects);
                }
            } catch (err) {
                console.error('Error fetching study data:', err);
                
                if (err.response?.status === 401) {
                    setError('Сессия истекла. Пожалуйста, войдите снова.');
                    dispatch(logout());
                } else {
                    setError(err.response?.data?.message || err.message || 'Ошибка при загрузке данных');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dispatch]);

    const getRatingColor = (rating, controlType) => {
        const type = controlType.toLowerCase();
        
        // Для зачета
        if (type === 'зачет') {
            return rating >= 59.01 ? 'success' : 'danger';
        }
        
        // Для экзамена и курсовых работ
        if (type === 'экзамен' || type === 'курсовые работы') {
            if (rating < 59.01) return 'danger';
            if (rating < 74.01) return 'warning text-dark';
            if (rating < 84.01) return 'primary';
            return 'success';
        }
        
        // Для остальных типов контроля
        return 'secondary';
    };

    const handleSubjectClick = (subjectId, controlType) => {
        navigate(`/subject/${subjectId}/${studyPlan.currentTerm}`, { state: { controlType } });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner animation="border" variant={isDark ? 'light' : 'dark'} />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="mt-3">
                {error}
            </Alert>
        );
    }

    return (
        <Card bg={isDark ? 'dark' : 'light'} text={isDark ? 'light' : 'dark'} border={isDark ? 'light' : 'dark'}>
            <Card.Header>
                <h3 className="mb-0">Учебный план</h3>
                {studyPlan && (
                    <div className="mt-2">
                        <Badge bg="primary" className="me-2">
                            Год: {studyPlan.year}
                        </Badge>
                        <Badge bg="primary" className="me-2">
                            Всего семестров: {studyPlan.termCount}
                        </Badge>
                        <Badge bg="primary">
                            Текущий семестр: {studyPlan.currentTerm}
                        </Badge>
                    </div>
                )}
            </Card.Header>
            <Card.Body>
                {subjects.length === 0 ? (
                    <Alert variant="info">
                        Нет предметов для текущего семестра
                    </Alert>
                ) : (
                    <Table striped bordered hover variant={isDark ? 'dark' : 'light'}>
                        <thead>
                            <tr>
                                <th>Дисциплина</th>
                                <th>Преподаватели</th>
                                <th>Тип контроля</th>
                                <th>Рейтинг</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((subject) => (
                                <tr 
                                    key={subject.disciplineId}
                                    onClick={() => handleSubjectClick(subject.disciplineId, subject.controlType)}
                                    style={{ cursor: 'pointer' }}
                                    className="hover-highlight"
                                >
                                    <td>{subject.disciplineName}</td>
                                    <td>
                                        {subject.instructors.map((instructor, index) => (
                                            <div key={index}>
                                                {instructor.lastName} {instructor.firstName} {instructor.middleName}
                                            </div>
                                        ))}
                                    </td>
                                    <td>{subject.controlType}</td>
                                    <td>
                                        {subject.rating > 0 ? (
                                            <Badge bg={getRatingColor(subject.rating, subject.controlType)}>
                                                {subject.rating.toFixed(2)}
                                            </Badge>
                                        ) : (
                                            <Badge bg="secondary">Нет данных</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
        </Card>
    );
};

export default StudyPlan; 