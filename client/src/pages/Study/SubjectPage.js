import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Table, Badge, Spinner, Alert, Button, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTheme } from '../../components/ThemeProvider';
import { studyApi } from '../../api/studyApi';
import './SubjectPage.css';

const SubjectPage = () => {
    const { subjectId, termNumber } = useParams();
    const location = useLocation();
    const [subjectData, setSubjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [predictedRatings, setPredictedRatings] = useState({});
    const [predictedBonusRatings, setPredictedBonusRatings] = useState({});
    const [predictedTotalRating, setPredictedTotalRating] = useState(null);
    const [controlType, setControlType] = useState(location.state?.controlType || 'экзамен');
    const [canSetAgreement, setCanSetAgreement] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);

    useEffect(() => {
        const checkAgreementStatus = async () => {
            try {
                if (subjectData?.id) {
                    const response = await studyApi.checkAgreementStatus(subjectData.id);
                    setCanSetAgreement(response);
                    setIsAgreed(subjectData.hasAgreement);
                }
            } catch (err) {
                console.error('Error checking agreement status:', err);
            }
        };

        checkAgreementStatus();
    }, [subjectData]);

    const handleAgreementChange = async (e) => {
        try {
            if (subjectData?.id) {
                await studyApi.setAgreement(subjectData.id, e.target.checked);
                setIsAgreed(e.target.checked);
            }
        } catch (err) {
            console.error('Error setting agreement:', err);
            // Revert checkbox state on error
            setIsAgreed(!e.target.checked);
        }
    };

    useEffect(() => {
        const fetchSubjectData = async () => {
            try {
                setLoading(true);
                setError(null);
                const isCourseWork = controlType?.toLowerCase() === 'курсовые работы';
                const data = await studyApi.getSubjectJournal(subjectId, termNumber, isCourseWork);
                setSubjectData(data);
                // Инициализируем предсказанные рейтинги текущими значениями
                const initialPredictions = {};
                const initialBonusPredictions = {};
                
                if (isCourseWork && data.courseWorksOrProjects) {
                    data.courseWorksOrProjects.forEach(item => {
                        // Используем текущий рейтинг, если он есть, иначе 0
                        const currentRating = item.rating || 0;
                        initialPredictions[item.name] = currentRating;
                    });
                } else {
                    data.currentControl.forEach(item => {
                        initialPredictions[item.name] = item.rating;
                    });
                }
                
                if (data.bonuses) {
                    data.bonuses.forEach(item => {
                        initialBonusPredictions[item.name] = item.rating;
                        if (!item.weight) {
                            item.weight = 1;
                        }
                    });
                }
                setPredictedRatings(initialPredictions);
                setPredictedBonusRatings(initialBonusPredictions);
                
                const { baseRating, bonusContribution, finalRating } = calculatePredictedRating(
                    isCourseWork ? data.courseWorksOrProjects : data.currentControl,
                    initialPredictions,
                    initialBonusPredictions
                );
                setPredictedTotalRating(finalRating);
            } catch (err) {
                console.error('Error fetching subject data:', err);
                setError(err.response?.data?.message || err.message || 'Ошибка при загрузке данных');
            } finally {
                setLoading(false);
            }
        };

        fetchSubjectData();
    }, [subjectId, termNumber, controlType]);

    useEffect(() => {
        if (subjectData) {
            console.log('Current ratings:', predictedRatings);
            console.log('Current bonus ratings:', predictedBonusRatings);
            const { baseRating, bonusContribution, finalRating } = calculatePredictedRating(
                subjectData.currentControl,
                predictedRatings,
                predictedBonusRatings
            );
            console.log('Calculated new rating:', finalRating);
            setPredictedTotalRating(finalRating);
        }
    }, [subjectData, predictedRatings, predictedBonusRatings]);

    const calculatePredictedRating = (controlPoints, ratings, bonusRatings = {}) => {
        // Расчет основного рейтинга
        let totalWeightedRating = 0;
        let totalWeight = 0;

        controlPoints.forEach(item => {
            const predictedRating = ratings[item.name] || 0;
            const weight = item.weight;
            totalWeightedRating += (predictedRating * weight);
            totalWeight += weight;
        });

        const baseRating = totalWeight > 0 ? (totalWeightedRating / totalWeight) : 0;

        // Расчет бонусного рейтинга
        let bonusContribution = 0;
        if (subjectData?.bonuses && subjectData.bonuses.length > 0) {
            let totalBonusWeight = 0;
            let totalBonusRating = 0;

            console.log('Calculating bonus contribution:');
            subjectData.bonuses.forEach(item => {
                const bonusRating = bonusRatings[item.name] || 0;
                const weight = item.weight || 1;
                const weightedBonus = bonusRating * weight;
                totalBonusRating += weightedBonus;
                totalBonusWeight += weight;
                console.log(`Bonus item: ${item.name}, Rating: ${bonusRating}, Weight: ${weight}, Weighted: ${weightedBonus}`);
            });

            console.log(`Total bonus rating: ${totalBonusRating}, Total bonus weight: ${totalBonusWeight}`);
            
            const averageBonusRating = totalBonusWeight > 0 ? (totalBonusRating / totalBonusWeight) : 0;
            console.log(`Average bonus rating: ${averageBonusRating}`);
            
            bonusContribution = (averageBonusRating / 100) * 15;
            console.log(`Bonus contribution (15% max): ${bonusContribution}`);
        }

        const finalRating = baseRating + bonusContribution;
        console.log(`Final calculation:
            Base rating: ${baseRating}
            Bonus contribution: ${bonusContribution}
            Final rating: ${finalRating}
        `);
        
        return {
            baseRating,
            bonusContribution,
            finalRating
        };
    };

    const handlePredictionChange = (name, value) => {
        // Если поле пустое, сохраняем пустую строку
        if (value === '') {
            setPredictedRatings(prevRatings => {
                const newRatings = {
                    ...prevRatings,
                    [name]: ''
                };
                return newRatings;
            });
            return;
        }

        // Преобразуем в число и ограничиваем диапазоном 0-100
        const numValue = Math.min(Math.max(parseFloat(value) || 0, 0), 100);
        setPredictedRatings(prevRatings => {
            const newRatings = {
                ...prevRatings,
                [name]: numValue
            };
            return newRatings;
        });
    };

    const handleBonusPredictionChange = (name, value) => {
        // Если поле пустое, сохраняем пустую строку
        if (value === '') {
            setPredictedBonusRatings(prevBonusRatings => {
                const newBonusRatings = {
                    ...prevBonusRatings,
                    [name]: ''
                };
                return newBonusRatings;
            });
            return;
        }

        // Преобразуем в число и ограничиваем диапазоном 0-100
        const numValue = Math.min(Math.max(parseFloat(value) || 0, 0), 100);
        setPredictedBonusRatings(prevBonusRatings => {
            const newBonusRatings = {
                ...prevBonusRatings,
                [name]: numValue
            };
            return newBonusRatings;
        });
    };

    const getRatingColor = (rating, controlType) => {
        if (!rating && rating !== 0) return 'secondary';
        
        const type = controlType?.toLowerCase() || 'экзамен';
        
        if (type === 'зачет') {
            return rating >= 59.01 ? 'success' : 'danger';
        }
        
        if (type === 'экзамен' || type === 'курсовые работы') {
            if (rating < 59.01) return 'danger';
            if (rating < 74.01) return 'warning text-dark';
            if (rating < 84.01) return 'primary';
            return 'success';
        }
        
        return 'secondary';
    };

    useEffect(() => {
        // Add event listeners to prevent text selection and context menu
        const preventDefault = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipElements.forEach(element => {
            element.addEventListener('selectstart', preventDefault);
            element.addEventListener('contextmenu', preventDefault);
            element.addEventListener('mousedown', preventDefault);
            element.addEventListener('touchstart', preventDefault);
        });

        // Cleanup function
        return () => {
            tooltipElements.forEach(element => {
                element.removeEventListener('selectstart', preventDefault);
                element.removeEventListener('contextmenu', preventDefault);
                element.removeEventListener('mousedown', preventDefault);
                element.removeEventListener('touchstart', preventDefault);
            });
        };
    }, [subjectData]); // Re-run when subjectData changes to catch new tooltips

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

    if (!subjectData) {
        return (
            <Alert variant="warning" className="mt-3">
                Данные по предмету не найдены
            </Alert>
        );
    }

    return (
        <div className="mt-4">
            <Button 
                variant={isDark ? 'outline-light' : 'outline-dark'} 
                className="mb-3"
                onClick={() => navigate(-1)}
            >
                ← Назад
            </Button>

            <Card bg={isDark ? 'dark' : 'light'} text={isDark ? 'light' : 'dark'} border={isDark ? 'light' : 'dark'}>
                <Card.Header>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                        <h3 className="mb-0">{subjectData.disciplineName}</h3>
                        {canSetAgreement && (
                            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
                                {subjectData.hasAgreement && (
                                    <Badge bg="primary" className="p-2">
                                        Рейтинг на момент согласия: {subjectData.agreementRating.toFixed(2)}
                                    </Badge>
                                )}
                                <Form.Check 
                                    type="checkbox"
                                    id="agreement-checkbox"
                                    label="Согласен с оценкой"
                                    checked={isAgreed}
                                    onChange={handleAgreementChange}
                                    disabled={!canSetAgreement}
                                />
                            </div>
                        )}
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="mb-4">
                        <h4>Текущий рейтинг</h4>
                        <div className="d-flex flex-column flex-sm-row gap-2">
                            <Badge bg="primary" className="p-2">
                                Текущий: {subjectData.currentRating.toFixed(2)}
                            </Badge>
                            <Badge bg="secondary" className="p-2">
                                Общий: {subjectData.totalRating.toFixed(2)}
                            </Badge>
                            {predictedTotalRating !== null && (
                                <Badge bg={getRatingColor(predictedTotalRating, controlType)} className="p-2">
                                    Предсказанный: {predictedTotalRating.toFixed(2)}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {controlType?.toLowerCase() === 'курсовые работы' ? (
                        <>
                            <h4>Курсовая работа</h4>
                            <Table striped bordered hover variant={isDark ? 'dark' : 'light'} className="mb-4">
                                <thead>
                                    <tr>
                                        <th>Название</th>
                                        <th>Рейтинг</th>
                                        <th>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Баллы</Tooltip>}
                                                delay={{ show: 0, hide: 250 }}
                                                trigger={['hover', 'focus', 'click']}
                                            >
                                                <div>
                                                    <span className="d-none d-sm-inline">Баллы</span>
                                                    <span className="d-inline d-sm-none">Б</span>
                                                </div>
                                            </OverlayTrigger>
                                        </th>
                                        <th>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Максимальные баллы</Tooltip>}
                                                delay={{ show: 0, hide: 250 }}
                                                trigger={['hover', 'focus', 'click']}
                                            >
                                                <div>
                                                    <span className="d-none d-sm-inline">Макс. баллы</span>
                                                    <span className="d-inline d-sm-none">МБ</span>
                                                </div>
                                            </OverlayTrigger>
                                        </th>
                                        <th>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Вес</Tooltip>}
                                                delay={{ show: 0, hide: 250 }}
                                                trigger={['hover', 'focus', 'click']}
                                            >
                                                <div>
                                                    <span className="d-none d-sm-inline">Вес</span>
                                                    <span className="d-inline d-sm-none">В</span>
                                                </div>
                                            </OverlayTrigger>
                                        </th>
                                        <th>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Предсказание</Tooltip>}
                                                delay={{ show: 0, hide: 250 }}
                                                trigger={['hover', 'focus', 'click']}
                                            >
                                                <div>
                                                    <span className="d-none d-sm-inline">Предсказание</span>
                                                    <span className="d-inline d-sm-none">Пред.</span>
                                                </div>
                                            </OverlayTrigger>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectData.courseWorksOrProjects.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td>
                                                <Badge bg={getRatingColor(item.rating, controlType)}>
                                                    {item.rating.toFixed(2)}
                                                </Badge>
                                            </td>
                                            <td>{item.point}</td>
                                            <td>{item.maxPoint}</td>
                                            <td>{item.weight}</td>
                                            <td>
                                                <InputGroup>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={predictedRatings[item.name] ?? ''}
                                                        onChange={(e) => handlePredictionChange(item.name, e.target.value)}
                                                        onBlur={(e) => handlePredictionChange(item.name, e.target.value)}
                                                        placeholder="Введите %"
                                                        className="d-none d-sm-block"
                                                    />
                                                    <InputGroup.Text className="d-none d-sm-block">%</InputGroup.Text>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={predictedRatings[item.name] ?? ''}
                                                        onChange={(e) => handlePredictionChange(item.name, e.target.value)}
                                                        onBlur={(e) => handlePredictionChange(item.name, e.target.value)}
                                                        placeholder="%"
                                                        className="d-sm-none"
                                                    />
                                                </InputGroup>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold">
                                        <td colSpan="5" className="text-end">Итого (без бонусов):</td>
                                        <td>
                                            <Badge bg={getRatingColor(calculatePredictedRating(subjectData.courseWorksOrProjects, predictedRatings).baseRating || 0, controlType)}>
                                                {calculatePredictedRating(subjectData.courseWorksOrProjects, predictedRatings).baseRating?.toFixed(2) || '0.00'}%
                                            </Badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </>
                    ) : (
                        <>
                            <h4>Текущий контроль</h4>
                            <Table striped bordered hover variant={isDark ? 'dark' : 'light'} className="mb-4">
                                <thead>
                                    <tr>
                                        <th>Название</th>
                                        <th>Рейтинг</th>
                                        <th>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Баллы</Tooltip>}
                                                delay={{ show: 0, hide: 250 }}
                                                trigger={['hover', 'focus', 'click']}
                                            >
                                                <div>
                                                    <span className="d-none d-sm-inline">Баллы</span>
                                                    <span className="d-inline d-sm-none">Б</span>
                                                </div>
                                            </OverlayTrigger>
                                        </th>
                                        <th>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Максимальные баллы</Tooltip>}
                                                delay={{ show: 0, hide: 250 }}
                                                trigger={['hover', 'focus', 'click']}
                                            >
                                                <div>
                                                    <span className="d-none d-sm-inline">Макс. баллы</span>
                                                    <span className="d-inline d-sm-none">МБ</span>
                                                </div>
                                            </OverlayTrigger>
                                        </th>
                                        <th>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Вес</Tooltip>}
                                                delay={{ show: 0, hide: 250 }}
                                                trigger={['hover', 'focus', 'click']}
                                            >
                                                <div>
                                                    <span className="d-none d-sm-inline">Вес</span>
                                                    <span className="d-inline d-sm-none">В</span>
                                                </div>
                                            </OverlayTrigger>
                                        </th>
                                        <th>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Предсказание</Tooltip>}
                                                delay={{ show: 0, hide: 250 }}
                                                trigger={['hover', 'focus', 'click']}
                                            >
                                                <div>
                                                    <span className="d-none d-sm-inline">Предсказание</span>
                                                    <span className="d-inline d-sm-none">Пред.</span>
                                                </div>
                                            </OverlayTrigger>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectData.currentControl.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td>
                                                <Badge bg={getRatingColor(item.rating, controlType)}>
                                                    {item.rating.toFixed(2)}
                                                </Badge>
                                            </td>
                                            <td>{item.point}</td>
                                            <td>{item.maxPoint}</td>
                                            <td>{item.weight}</td>
                                            <td>
                                                <InputGroup>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={predictedRatings[item.name] ?? ''}
                                                        onChange={(e) => handlePredictionChange(item.name, e.target.value)}
                                                        onBlur={(e) => handlePredictionChange(item.name, e.target.value)}
                                                        placeholder="Введите %"
                                                        className="d-none d-sm-block"
                                                    />
                                                    <InputGroup.Text className="d-none d-sm-block">%</InputGroup.Text>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={predictedRatings[item.name] ?? ''}
                                                        onChange={(e) => handlePredictionChange(item.name, e.target.value)}
                                                        onBlur={(e) => handlePredictionChange(item.name, e.target.value)}
                                                        placeholder="%"
                                                        className="d-sm-none"
                                                    />
                                                </InputGroup>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold">
                                        <td colSpan="5" className="text-end">Итого (без бонусов):</td>
                                        <td>
                                            <Badge bg={getRatingColor(calculatePredictedRating(subjectData.currentControl, predictedRatings).baseRating || 0, controlType)}>
                                                {calculatePredictedRating(subjectData.currentControl, predictedRatings).baseRating?.toFixed(2) || '0.00'}%
                                            </Badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </>
                    )}

                    {subjectData.bonuses && subjectData.bonuses.length > 0 && (
                        <>
                            <h4>Бонусы</h4>
                            <Table striped bordered hover variant={isDark ? 'dark' : 'light'} className="mb-4">
                                <thead>
                                    <tr>
                                        <th>Название</th>
                                        <th>Рейтинг</th>
                                        <th>Баллы</th>
                                        <th>Макс. баллы</th>
                                        <th>Вес</th>
                                        <th>Предсказание</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectData.bonuses.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td>
                                                <Badge bg={getRatingColor(item.rating, controlType)}>
                                                    {item.rating.toFixed(2)}
                                                </Badge>
                                            </td>
                                            <td>{item.point}</td>
                                            <td>{item.maxPoint}</td>
                                            <td>{item.weight}</td>
                                            <td>
                                                <InputGroup>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={predictedBonusRatings[item.name] ?? ''}
                                                        onChange={(e) => handleBonusPredictionChange(item.name, e.target.value)}
                                                        onBlur={(e) => handleBonusPredictionChange(item.name, e.target.value)}
                                                        placeholder="Введите %"
                                                        className="d-none d-sm-block"
                                                    />
                                                    <InputGroup.Text className="d-none d-sm-block">%</InputGroup.Text>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={predictedBonusRatings[item.name] ?? ''}
                                                        onChange={(e) => handleBonusPredictionChange(item.name, e.target.value)}
                                                        onBlur={(e) => handleBonusPredictionChange(item.name, e.target.value)}
                                                        placeholder="%"
                                                        className="d-sm-none"
                                                    />
                                                </InputGroup>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold">
                                        <td colSpan="5" className="text-end">Максимальный бонус к рейтингу:</td>
                                        <td>
                                            <Badge bg="secondary">+15%</Badge>
                                        </td>
                                    </tr>
                                    <tr className="fw-bold">
                                        <td colSpan="5" className="text-end">Итого с бонусами:</td>
                                        <td>
                                            <Badge bg={getRatingColor(predictedTotalRating || 0, controlType)}>
                                                {predictedTotalRating?.toFixed(2) || '0.00'}%
                                            </Badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </>
                    )}

                    {subjectData.attestation && subjectData.attestation.length > 0 && (
                        <>
                            <h4>Аттестация</h4>
                            <Table striped bordered hover variant={isDark ? 'dark' : 'light'}>
                                <thead>
                                    <tr>
                                        <th>Название</th>
                                        <th>Рейтинг</th>
                                        <th>Баллы</th>
                                        <th>Макс. баллы</th>
                                        <th>Вес</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectData.attestation.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td>
                                                <Badge bg={getRatingColor(item.rating, controlType)}>
                                                    {item.rating.toFixed(2)}
                                                </Badge>
                                            </td>
                                            <td>{item.point}</td>
                                            <td>{item.maxPoint}</td>
                                            <td>{item.weight}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default SubjectPage; 