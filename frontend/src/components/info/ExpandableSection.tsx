import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';

interface SubsectionItem {
  title: string;
  content: string | React.ReactNode;
}

interface ExpandableSectionProps {
  title: string;
  icon?: React.ReactNode;
  subsections?: SubsectionItem[];
  content?: string | React.ReactNode;
  badge?: string;
  defaultExpanded?: boolean;
}

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: `${theme.spacing(2)} 0`,
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.02)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
  },
  '& .MuiAccordionSummary-content': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.02)'
    : 'rgba(0, 0, 0, 0.01)',
}));

const SubsectionContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.02)',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(0.75),
  '&:last-child': {
    marginBottom: 0,
  },
}));

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  icon,
  subsections,
  content,
  badge,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <StyledAccordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      elevation={0}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
        {icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            flex: 1,
          }}
        >
          {title}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        )}
      </StyledAccordionSummary>

      <StyledAccordionDetails>
        {subsections && subsections.length > 0 ? (
          <Box>
            {subsections.map((subsection, index) => (
              <SubsectionContainer key={index} elevation={0}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    marginBottom: 1,
                    color: 'primary.main',
                  }}
                >
                  {subsection.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    lineHeight: 1.7,
                    color: 'text.secondary',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {subsection.content}
                </Typography>
              </SubsectionContainer>
            ))}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              lineHeight: 1.7,
              color: 'text.secondary',
              whiteSpace: 'pre-wrap',
            }}
          >
            {content}
          </Typography>
        )}
      </StyledAccordionDetails>
    </StyledAccordion>
  );
};
