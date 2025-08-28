#!/bin/bash
# Automated script for updating transformation plan with proper change control

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PLAN_FILE="TRANSFORMATION_PLAN_V4.md"
CHANGELOG_FILE="TRANSFORMATION_CHANGELOG.md"
CURRENT_VERSION=$(grep -m 1 "Version:" $PLAN_FILE | sed 's/.*Version: \([0-9.]*\).*/\1/')

echo -e "${GREEN}=== Transformation Plan Update Tool ===${NC}"
echo "Current Version: $CURRENT_VERSION"
echo ""

# 1. Collect change information
echo -e "${YELLOW}Step 1: Change Information${NC}"
read -p "Your Name: " CHANGED_BY
read -p "Change Priority (CRITICAL/HIGH/MEDIUM/LOW): " PRIORITY
read -p "Brief description of change: " DESCRIPTION

# 2. Determine change type
echo -e "\n${YELLOW}Step 2: Change Classification${NC}"
echo "1. Minor update (typos, clarifications)"
echo "2. Task modification (duration, owner, dependencies)"
echo "3. Add/remove tasks"
echo "4. Phase changes"
echo "5. Major structural changes"
read -p "Select change type (1-5): " CHANGE_TYPE

# 3. Calculate new version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $CHANGE_TYPE in
    1)
        PATCH=$((PATCH + 1))
        APPROVAL_NEEDED="Team Lead"
        ;;
    2|3)
        MINOR=$((MINOR + 1))
        PATCH=0
        APPROVAL_NEEDED="CTO"
        ;;
    4|5)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        APPROVAL_NEEDED="Stakeholder Committee"
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# 4. Impact assessment
echo -e "\n${YELLOW}Step 3: Impact Assessment${NC}"
read -p "Schedule impact (days, 0 if none): " SCHEDULE_IMPACT
read -p "Budget impact (USD, 0 if none): " BUDGET_IMPACT
read -p "Risk assessment (brief): " RISK_IMPACT

# 5. Create change request
CHANGE_ID="CR-$(date +%Y-%m-%d)-$(printf "%03d" $RANDOM)"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")

echo -e "\n${YELLOW}Step 4: Creating Change Request${NC}"
echo "Change Request ID: $CHANGE_ID"
echo "New Version: $NEW_VERSION"
echo "Approval Required: $APPROVAL_NEEDED"

# 6. Create backup
echo -e "\n${YELLOW}Step 5: Creating Backup${NC}"
cp $PLAN_FILE "$PLAN_FILE.backup-$(date +%Y%m%d-%H%M%S)"
cp $CHANGELOG_FILE "$CHANGELOG_FILE.backup-$(date +%Y%m%d-%H%M%S)"

# 7. Create git branch
echo -e "\n${YELLOW}Step 6: Creating Git Branch${NC}"
BRANCH_NAME="transformation/update-v$NEW_VERSION"
git checkout -b "$BRANCH_NAME"

# 8. Open editor for plan changes
echo -e "\n${YELLOW}Step 7: Edit Transformation Plan${NC}"
echo "Opening editor for plan changes..."
echo "Remember to:"
echo "1. Update Version to $NEW_VERSION"
echo "2. Update Last Updated timestamp"
echo "3. Make your specific changes"
echo "4. Update progress tracking if needed"
read -p "Press Enter to continue..."

${EDITOR:-vi} $PLAN_FILE

# 9. Generate changelog entry
echo -e "\n${YELLOW}Step 8: Updating Change Log${NC}"

CHANGELOG_ENTRY="### [$NEW_VERSION] - $TIMESTAMP
**Changed By**: $CHANGED_BY  
**Approved By**: PENDING  
**Trigger**: $DESCRIPTION  
**Priority**: $PRIORITY  

#### Changes Made:
- $DESCRIPTION

#### Impact:
- **Schedule**: $SCHEDULE_IMPACT days
- **Budget**: \$$BUDGET_IMPACT
- **Resources**: [TO BE FILLED]
- **Risk**: $RISK_IMPACT

#### Justification:
[TO BE FILLED IN REVIEW]

---

"

# Insert after Version History header
sed -i.bak "/## Version History/a\\
\\
$CHANGELOG_ENTRY" $CHANGELOG_FILE

# 10. Show diff
echo -e "\n${YELLOW}Step 9: Review Changes${NC}"
git diff $PLAN_FILE $CHANGELOG_FILE

# 11. Commit changes
echo -e "\n${YELLOW}Step 10: Commit Changes${NC}"
read -p "Commit these changes? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add $PLAN_FILE $CHANGELOG_FILE
    
    COMMIT_MSG="transformation: Update plan to v$NEW_VERSION

Change ID: $CHANGE_ID
Priority: $PRIORITY
Trigger: $DESCRIPTION

Impact:
- Schedule: $SCHEDULE_IMPACT days
- Budget: \$$BUDGET_IMPACT
- Risk: $RISK_IMPACT

Requires approval from: $APPROVAL_NEEDED"

    git commit -m "$COMMIT_MSG"
    
    # 12. Push and create PR
    echo -e "\n${YELLOW}Step 11: Creating Pull Request${NC}"
    git push origin "$BRANCH_NAME"
    
    PR_BODY="## Change Request: $CHANGE_ID

### Version Update
$CURRENT_VERSION → $NEW_VERSION

### Priority
$PRIORITY

### Description
$DESCRIPTION

### Impact Assessment
- **Schedule**: $SCHEDULE_IMPACT days
- **Budget**: \$$BUDGET_IMPACT
- **Risk**: $RISK_IMPACT

### Approval Required
$APPROVAL_NEEDED

### Checklist
- [ ] Plan updated with changes
- [ ] Changelog entry created
- [ ] Impact assessment completed
- [ ] Stakeholders notified
- [ ] Risk register updated (if needed)
- [ ] Resource allocation adjusted (if needed)

### Reviews Required
- [ ] Technical review
- [ ] $APPROVAL_NEEDED approval

/cc @cto @transformation-lead"

    gh pr create \
        --title "Transformation Update v$NEW_VERSION: $DESCRIPTION" \
        --body "$PR_BODY" \
        --label "transformation,priority-$PRIORITY" \
        --reviewer "cto,transformation-lead"
    
    # 13. Send notifications
    echo -e "\n${YELLOW}Step 12: Sending Notifications${NC}"
    
    # Slack notification (if webhook configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST $SLACK_WEBHOOK_URL \
            -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🔔 Transformation Plan Update\",
                \"blocks\": [{
                    \"type\": \"section\",
                    \"text\": {
                        \"type\": \"mrkdwn\",
                        \"text\": \"*Transformation Plan Update Proposed*\n\nVersion: \`$CURRENT_VERSION\` → \`$NEW_VERSION\`\nPriority: \`$PRIORITY\`\nChange: $DESCRIPTION\nRequires: $APPROVAL_NEEDED approval\n\n<$PR_URL|View Pull Request>\"
                    }
                }]
            }"
    fi
    
    echo -e "\n${GREEN}✅ Change request created successfully!${NC}"
    echo "Change ID: $CHANGE_ID"
    echo "New Version: $NEW_VERSION"
    echo "Pull Request: Created"
    echo ""
    echo "Next Steps:"
    echo "1. $APPROVAL_NEEDED must review and approve"
    echo "2. After approval, merge PR"
    echo "3. Update tracking systems"
    echo "4. Communicate to affected teams"
    
else
    echo -e "${RED}Changes cancelled. Rolling back...${NC}"
    git checkout .
    git checkout -
    git branch -D "$BRANCH_NAME"
fi